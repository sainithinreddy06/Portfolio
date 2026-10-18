import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { getPortfolioStore, savePortfolioStore } from './deployedPortfolioStore';
import { verifyAdminToken } from './deployedAuthService';
import { initialPortfolioContent } from '../src/content/portfolioData';
import { isSafeAssetUrl } from './portfolioValidation';
import { reportApiFailure } from './apiErrors';

type AssetKind = 'photo' | 'resume';
class AssetInputError extends Error { constructor(message: string, public status = 400) { super(message); } }

export function decodeUpload(dataUri: unknown, kind: AssetKind) {
  if (typeof dataUri !== 'string') throw new AssetInputError('Provide a base64 file upload.');
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUri);
  if (!match) throw new AssetInputError('Upload must be a valid base64 data URI.');
  const bytes = Buffer.from(match[2], 'base64');
  // Keep the base64 JSON request safely below Netlify's buffered request limit.
  if (bytes.length > 4 * 1024 * 1024) throw new AssetInputError('Uploads must be 4 MB or smaller. Use a hosted URL for larger files.', 413);
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const mime = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : '';
  if (kind === 'resume') {
    if (match[1] !== 'application/pdf' || bytes.toString('ascii', 0, 5) !== '%PDF-') throw new AssetInputError('Resume must be a valid PDF.');
    return { bytes, mime: 'application/pdf', extension: 'pdf' };
  }
  if (!mime || match[1] !== mime) throw new AssetInputError('Portrait must be a valid PNG, JPEG, or WebP image.');
  return { bytes, mime, extension: png ? 'png' : jpeg ? 'jpg' : 'webp' };
}

export async function handlePortfolioAsset(request: Request, kind: AssetKind): Promise<Response> {
  const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const root = `/api/portfolio/${kind}`;
  const pathname = new URL(request.url).pathname;
  // Supports both public rewrites and direct function invocations.
  const prefix = pathname.startsWith(root) ? root : `/.netlify/functions/${kind}`;
  const suffix = pathname.slice(prefix.length).replace(/^\//, '');
  const fileRequest = /^file\/([a-f0-9-]+\.(png|jpg|webp|pdf))$/.exec(suffix);
  const versionRequest = /^version\/([^/]+)$/.exec(suffix);
  if (suffix && !fileRequest && !versionRequest && !['rollback', 'history'].includes(suffix)) return json({ success: false, error: 'API route not found.' }, 404);
  const method = fileRequest || suffix === 'history' ? 'GET' : versionRequest ? 'DELETE' : suffix === 'rollback' ? 'POST' : undefined;
  if ((method && request.method !== method) || (!method && !['GET', 'POST'].includes(request.method))) return Response.json({ success: false, error: 'Method not allowed.' }, { status: 405, headers: { Allow: method || 'GET, POST' } });
  try {
    if (fileRequest) {
      const extension = fileRequest[2];
      if ((kind === 'resume') !== (extension === 'pdf')) return json({ success: false, error: 'File not found.' }, 404);
      const bytes = await getStore({ name: 'portfolio-assets', consistency: 'strong' }).get(`${kind}/${fileRequest[1]}`, { type: 'arrayBuffer' });
      if (!bytes) return json({ success: false, error: 'File not found.' }, 404);
      const mime = extension === 'pdf' ? 'application/pdf' : extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
      return new Response(bytes, { headers: { 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' } });
    }
    if (request.method !== 'GET' || suffix === 'history') {
      const authorization = request.headers.get('authorization');
      const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : request.headers.get('x-admin-token') || undefined;
      if (!(await verifyAdminToken(token)).valid) return json({ success: false, requiresLogin: true, error: 'Valid admin session required.' }, 401);
    }
    let store;
    try {
      store = await getPortfolioStore();
    } catch (storeError) {
      if (request.method === 'GET') {
        if (kind === 'photo') {
          return Response.redirect(new URL('/images/profile-photo.png', request.url), 302);
        }
        if (kind === 'resume' && !suffix) {
          return json({
            success: true,
            resume: {
              fileUrl: '/resume.pdf',
              fileName: 'Sai_Nithin_Reddy_Resume.pdf',
              fileSize: '137 KB',
              isAvailable: true,
            },
          });
        }
      }
      throw storeError;
    }
    const current = store.content.profile[kind];
    if (request.method === 'GET') {
      if (suffix === 'history') return json({ success: true, versions: current.versions || [] });
      if (kind === 'resume') return json({ success: true, resume: current });
      const photo = store.content.profile.photo;
      let targetUrl = photo.isPlaceholder ? '/images/default-profile.png' : photo.url;
      if (!targetUrl || targetUrl.startsWith('/api/portfolio/photo')) {
        targetUrl = '/images/profile-photo.png';
      }
      return Response.redirect(new URL(targetUrl, request.url), 302);
    }
    if (versionRequest) {
      const version = current.versions?.find(v => v.id === versionRequest[1]);
      if (!version) return json({ success: false, error: 'Version not found.' }, 404);
      if (version.isActive) throw new AssetInputError('Restore another version or reset before deleting the active file.');
      current.versions = (current.versions || []).filter(v => v.id !== version.id) as any;
      await savePortfolioStore(store);
      // Version metadata is authoritative; orphan bytes are retained if storage deletion fails.
      const url = 'url' in version ? version.url : version.fileUrl;
      if (url.startsWith(`${root}/file/`)) await getStore('portfolio-assets').delete(`${kind}/${url.split('/').pop()}`);
      return json({ success: true, versions: current.versions });
    }
    let body;
    try { body = await request.json(); } catch { throw new AssetInputError('Request body must be valid JSON.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AssetInputError('Request body must be an object.');
    const versions = (current.versions || []).map(v => ({ ...v, isActive: false }));
    if (suffix === 'rollback') {
      const version = versions.find(v => v.id === body.versionId);
      if (!version) return json({ success: false, error: 'Version not found.' }, 404);
      version.isActive = true;
      if (kind === 'photo') store.content.profile.photo = { ...store.content.profile.photo, url: (version as any).url, isPlaceholder: false, versions: versions as any };
      else store.content.profile.resume = { ...store.content.profile.resume, fileUrl: (version as any).fileUrl, fileName: version.fileName, fileSize: version.fileSize, uploadedAt: version.uploadedAt, isAvailable: true, versions: versions as any };
    } else if (body.reset === true) {
      if (kind === 'photo') store.content.profile.photo = { ...initialPortfolioContent.profile.photo, url: '/images/default-profile.png', isPlaceholder: true, versions: versions as any };
      else store.content.profile.resume = { ...initialPortfolioContent.profile.resume, versions: versions as any };
    } else if (body.dataUri) {
      const upload = decodeUpload(body.dataUri, kind);
      const id = randomUUID();
      const filename = `${id}.${upload.extension}`;
      const key = `${kind}/${filename}`;
      const fileUrl = `${root}/file/${filename}`;
      await getStore({ name: 'portfolio-assets', consistency: 'strong' }).set(key, new Uint8Array(upload.bytes).buffer);
      const version = { id, fileName: typeof body.fileName === 'string' ? body.fileName : `${kind}.${upload.extension}`, fileSize: `${Math.ceil(upload.bytes.length / 1024)} KB`, uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), timestamp: Date.now(), isActive: true };
      if (kind === 'photo') store.content.profile.photo = { ...store.content.profile.photo, url: fileUrl, altText: typeof body.altText === 'string' ? body.altText : store.content.profile.photo.altText, isPlaceholder: false, versions: [...versions, { ...version, url: fileUrl }] as any };
      else store.content.profile.resume = { ...store.content.profile.resume, ...version, fileUrl, isAvailable: true, versions: [...versions, { ...version, fileUrl }] as any };
    } else {
      const url = kind === 'photo' ? body.imageUrl : body.fileUrl;
      if (!isSafeAssetUrl(url) || url.split(/[?#]/)[0] === root) throw new AssetInputError('Provide a safe file URL, file upload, or reset flag.');
      if (kind === 'photo') store.content.profile.photo = { ...store.content.profile.photo, url, altText: typeof body.altText === 'string' ? body.altText : store.content.profile.photo.altText, isPlaceholder: false, versions: versions as any };
      else store.content.profile.resume = { ...store.content.profile.resume, fileUrl: url, fileName: typeof body.fileName === 'string' ? body.fileName : 'Curriculum_Vitae.pdf', fileSize: typeof body.fileSize === 'string' ? body.fileSize : 'Cloud Document', isAvailable: body.isAvailable !== false, comingSoonMessage: typeof body.comingSoonMessage === 'string' ? body.comingSoonMessage : store.content.profile.resume.comingSoonMessage, versions: versions as any };
    }
    await savePortfolioStore(store);
    return json({ success: true, [kind]: store.content.profile[kind] });
  } catch (error) {
    if (error instanceof AssetInputError) return json({ success: false, error: error.message }, error.status);
    reportApiFailure(kind, error);
    return json({ success: false, error: 'Asset storage is unavailable. Check database and file storage configuration.' }, 503);
  }
}
