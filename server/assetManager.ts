import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { draftPortfolioStore, getPortfolioStore, savePortfolioStore, StoreError } from './portfolioStore';
import { ResumeVersionItem, PhotoVersionItem } from '../src/content/types';
import { uploadAssetToStorage } from './cloudStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const RESUMES_DIR = path.join(DATA_DIR, 'uploads', 'resumes');
const PHOTOS_DIR = path.join(DATA_DIR, 'uploads', 'photos');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const PUBLIC_IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_IMAGES_DIR = path.join(DIST_DIR, 'images');

// -------------------------------------------------------------
// RESUME ASSET MANAGEMENT
// -------------------------------------------------------------

/**
 * Validates that buffer starts with '%PDF-' magic bytes
 */
export function isValidPdf(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  const header = buffer.subarray(0, 5).toString('ascii');
  return header.startsWith('%PDF-');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function saveUploadedResume(
  buffer: Buffer,
  originalFileName: string = 'Sai_Nithin_Reddy_Resume.pdf',
  customFileSize?: string
) {

  if (buffer.length > 15 * 1024 * 1024) {
    throw new StoreError(400, 'Resume PDF exceeds the 15 MB maximum size limit.');
  }

  if (!isValidPdf(buffer)) {
    throw new StoreError(400, 'Invalid file format. The uploaded file does not contain a valid PDF signature (%PDF-).');
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const versionId = `v-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const versionFileName = `resume-${versionId}.pdf`;
  const versionFilePath = path.join(RESUMES_DIR, versionFileName);

  const remoteUrl = await uploadAssetToStorage(buffer, versionFileName, 'resume', 'application/pdf');
  if (!remoteUrl) {
    fs.mkdirSync(RESUMES_DIR, { recursive: true });
    fs.writeFileSync(versionFilePath, buffer, { flag: 'wx' });
  }
  const activeFileUrl = remoteUrl || '/resume.pdf';

  const sizeStr = customFileSize || formatFileSize(buffer.length);
  const store = draftPortfolioStore();

  const newVersion: ResumeVersionItem = {
    id: versionId,
    fileName: originalFileName,
    fileSize: sizeStr,
    uploadedAt: dateFormatted,
    timestamp: Date.now(),
    fileUrl: activeFileUrl,
    isActive: true,
  };

  const existingVersions = (store.content.profile.resume.versions || []).map((v) => ({
    ...v,
    isActive: false,
  }));

  const updatedVersions = [newVersion, ...existingVersions];

  store.content.profile.resume = {
    ...store.content.profile.resume,
    fileUrl: activeFileUrl,
    fileName: 'Sai_Nithin_Reddy_Resume.pdf',
    fileSize: sizeStr,
    uploadedAt: dateFormatted,
    isAvailable: true,
    comingSoonMessage: 'Verified custom curriculum vitae active and available.',
    versions: updatedVersions,
  };

  await savePortfolioStore(store);

  return {
    success: true,
    resume: store.content.profile.resume,
    version: newVersion,
    storageProvider: remoteUrl ? 'supabase' : 'repository_static',
  };
}

/**
 * Rolls back to a previous resume version
 */
export async function rollbackResumeVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new StoreError(400, 'Invalid resume version ID format.');
  }
  const store = draftPortfolioStore();
  const versions = store.content.profile.resume.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new StoreError(400, `Resume version ${versionId} not found in history.`);
  }

  const versionFileName = `resume-${versionId}.pdf`;
  const versionFilePath = path.join(RESUMES_DIR, versionFileName);

  if (!isRemote(target.fileUrl) && !fs.existsSync(versionFilePath)) {
    throw new StoreError(400, 'Archived resume is unavailable.');
  }

  const updatedVersions = versions.map((v) => ({
    ...v,
    isActive: v.id === versionId,
  }));

  const rollbackUrl = target.fileUrl || '/resume.pdf';

  store.content.profile.resume = {
    ...store.content.profile.resume,
    fileUrl: rollbackUrl,
    fileName: target.fileName || 'Sai_Nithin_Reddy_Resume.pdf',
    fileSize: target.fileSize,
    uploadedAt: target.uploadedAt,
    isAvailable: true,
    versions: updatedVersions,
  };

  await savePortfolioStore(store);
  return {
    success: true,
    resume: store.content.profile.resume,
  };
}

/**
 * Deletes a historical resume version
 */
export async function deleteResumeVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new StoreError(400, 'Invalid resume version ID format.');
  }
  const store = draftPortfolioStore();
  const versions = store.content.profile.resume.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new StoreError(400, `Resume version ${versionId} not found.`);
  }

  if (target.isActive) {
    throw new StoreError(400, 'Cannot delete the currently active published resume version. Switch to another version first.');
  }

  store.content.profile.resume.versions = versions.filter((v) => v.id !== versionId);
  await savePortfolioStore(store);
  const versionFileName = `resume-${versionId}.pdf`;
  const versionFilePath = path.join(RESUMES_DIR, versionFileName);
  if (fs.existsSync(versionFilePath)) {
    try {
      fs.unlinkSync(versionFilePath);
    } catch {
      // ignore unlink failure
    }
  }



  return {
    success: true,
    versions: store.content.profile.resume.versions,
  };
}

export function getActiveResumeFile(): {
  found: boolean;
  filePath?: string;
  buffer?: Buffer;
  externalUrl?: string;
} {
  const { resume } = getPortfolioStore().content.profile;
  if (isRemote(resume.fileUrl)) return { found: true, externalUrl: resume.fileUrl };
  const active = resume.versions?.find(v => v.isActive);
  if (active && safeId(active.id)) {
    const filePath = path.join(RESUMES_DIR, `resume-${active.id}.pdf`);
    if (fs.existsSync(filePath)) return { found: true, filePath };
  }
  for (const filePath of [path.join(PUBLIC_DIR, 'resume.pdf'), path.join(DIST_DIR, 'resume.pdf'), path.join(DATA_DIR, 'uploaded-resume.pdf')]) {
    if (fs.existsSync(filePath)) return { found: true, filePath };
  }
  return { found: false };
}

// -------------------------------------------------------------
// PROFILE PHOTO ASSET MANAGEMENT
// -------------------------------------------------------------

/**
 * Validates image buffer signatures (JPEG, PNG, WEBP)
 */
export function validateImageSignature(buffer: Buffer): { valid: boolean; ext: 'png' | 'jpg' | 'webp'; mime: string } {
  if (buffer.length < 12) {
    throw new StoreError(400, 'File buffer is too small to be a valid image.');
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer.subarray(3, 8).equals(Buffer.from([0x47, 13, 10, 26, 10]))
  ) {
    return { valid: true, ext: 'png', mime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }

  // WEBP: RIFF ... WEBP
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return { valid: true, ext: 'webp', mime: 'image/webp' };
  }

  throw new StoreError(400, 'Unsupported image format. Please upload a standard JPEG, PNG, or WEBP image.');
}

export async function saveUploadedPhoto(
  buffer: Buffer,
  originalFileName: string = 'portrait.png',
  altText?: string
) {

  if (buffer.length > 10 * 1024 * 1024) {
    throw new StoreError(400, 'Profile photo exceeds 10 MB maximum limit.');
  }

  const { ext, mime } = validateImageSignature(buffer);

  const versionId = `photo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const versionFileName = `${versionId}.${ext}`;
  const versionFilePath = path.join(PHOTOS_DIR, versionFileName);

  const remoteUrl = await uploadAssetToStorage(buffer, versionFileName, 'photo', mime);
  if (!remoteUrl) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    fs.writeFileSync(versionFilePath, buffer, { flag: 'wx' });
  }
  const photoUrl = remoteUrl || `/api/portfolio/photo?v=${versionId}`;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const store = draftPortfolioStore();

  const newVersion: PhotoVersionItem = {
    id: versionId,
    fileName: originalFileName,
    fileSize: formatFileSize(buffer.length),
    uploadedAt: dateFormatted,
    timestamp: Date.now(),
    url: photoUrl,
    isActive: true,
  };

  const existingVersions = (store.content.profile.photo.versions || []).map((v) => ({
    ...v,
    isActive: false,
  }));

  const updatedVersions = [newVersion, ...existingVersions];

  store.content.profile.photo = {
    ...store.content.profile.photo,
    url: photoUrl,
    altText:
      altText ||
      `Portrait of ${store.content.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
    showInHero: true,
    showInAbout: false,
    isPlaceholder: false,
    versions: updatedVersions,
  };

  await savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
    version: newVersion,
    storageProvider: remoteUrl ? 'supabase' : 'repository_static',
    mime,
  };
}

/**
 * Rolls back to a previous photo version
 */
export async function rollbackPhotoVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new StoreError(400, 'Invalid photo version ID format.');
  }
  const store = draftPortfolioStore();
  const versions = store.content.profile.photo.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new StoreError(400, `Photo version ${versionId} not found in history.`);
  }

  if (!isRemote(target.url) && !archivedPhoto(versionId)) throw new StoreError(400, 'Archived photo is unavailable.');

  const photoUrl = target.url || `/api/portfolio/photo?v=${Date.now()}`;
  const updatedVersions = versions.map((v) => ({
    ...v,
    isActive: v.id === versionId,
  }));

  store.content.profile.photo = {
    ...store.content.profile.photo,
    url: photoUrl,
    isPlaceholder: false,
    versions: updatedVersions,
  };

  await savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
  };
}

/**
 * Resets profile photo to default permanent portrait asset
 */
export async function resetPhotoToPlaceholder() {
  const store = draftPortfolioStore();

  const versions = (store.content.profile.photo.versions || []).map((v) => ({
    ...v,
    isActive: false,
  }));

  // Point to permanent default uploaded photo asset
  const defaultUrl = '/images/profile-photo.png';

  store.content.profile.photo = {
    url: defaultUrl,
    altText: `Portrait of ${store.content.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
    showInHero: true,
    showInAbout: false,
    isPlaceholder: false,
    versions,
  };

  await savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
  };
}

/**
 * Deletes a historical photo version
 */
export async function deletePhotoVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new StoreError(400, 'Invalid photo version ID format.');
  }
  const store = draftPortfolioStore();
  const versions = store.content.profile.photo.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new StoreError(400, `Photo version ${versionId} not found.`);
  }

  if (target.isActive) {
    throw new StoreError(400, 'Cannot delete the currently active profile photo version. Switch to another photo first.');
  }

  store.content.profile.photo.versions = versions.filter((v) => v.id !== versionId);
  await savePortfolioStore(store);
  const file = archivedPhoto(versionId);
  if (file) {
    try { fs.rmSync(file, { force: true }); } catch { console.warn('[AssetManager] Inactive archive could not be removed.'); }
  }


  return {
    success: true,
    versions: store.content.profile.photo.versions,
  };
}

function safeId(id: string) { return /^[a-zA-Z0-9_-]+$/.test(id); }
function isRemote(url?: string) { return !!url && /^https?:\/\//i.test(url); }
function archivedPhoto(id: string) {
  return safeId(id) && ['png','jpg','webp','jpeg'].map(ext => path.join(PHOTOS_DIR, id + '.' + ext)).find(p => fs.existsSync(p));
}

export function getActivePhotoFile(): { found: boolean; filePath?: string; mime?: string; externalUrl?: string } {
  const photo = getPortfolioStore().content.profile.photo;
  if (isRemote(photo.url)) return { found: true, externalUrl: photo.url };
  const active = photo.versions?.find(v => v.isActive);
  const file = active && archivedPhoto(active.id);
  if (file) return { found: true, filePath: file, mime: 'image/' + path.extname(file).slice(1).replace(/^jpg$/, 'jpeg') };
  if (photo.url === '/images/profile-photo.png') {
    const filePath = path.join(PUBLIC_IMAGES_DIR, 'profile-photo.png');
    if (fs.existsSync(filePath)) return { found: true, filePath, mime: 'image/png' };
  }
  const searchDirs = [DATA_DIR, PUBLIC_IMAGES_DIR, DIST_IMAGES_DIR];
  const extensions = [
    { ext: 'png', mime: 'image/png' },
    { ext: 'jpg', mime: 'image/jpeg' },
    { ext: 'jpeg', mime: 'image/jpeg' },
    { ext: 'webp', mime: 'image/webp' },
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const { ext, mime } of extensions) {
      const filePath = path.join(dir, `profile-photo.${ext}`);
      if (fs.existsSync(filePath)) {
        return { found: true, filePath, mime };
      }
    }
  }

  // Fallback to permanent default-profile.png
  for (const dir of [PUBLIC_IMAGES_DIR, DIST_IMAGES_DIR, DATA_DIR]) {
    if (!fs.existsSync(dir)) continue;
    const defaultPath = path.join(dir, 'default-profile.png');
    if (fs.existsSync(defaultPath)) {
      return { found: true, filePath: defaultPath, mime: 'image/png' };
    }
  }

  return { found: false };
}
