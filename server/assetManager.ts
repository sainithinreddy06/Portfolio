import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPortfolioStore, savePortfolioStore } from './portfolioStore';
import { ResumeVersionItem, PhotoVersionItem } from '../src/content/types';
import { uploadAssetToStorage } from './cloudStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const RESUMES_DIR = path.join(DATA_DIR, 'uploads', 'resumes');
const PHOTOS_DIR = path.join(DATA_DIR, 'uploads', 'photos');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const PUBLIC_IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_IMAGES_DIR = path.join(DIST_DIR, 'images');

export function ensureStorageDirectories(): void {
  const dirs = [DATA_DIR, RESUMES_DIR, PHOTOS_DIR, PUBLIC_DIR, PUBLIC_IMAGES_DIR];
  if (fs.existsSync(DIST_DIR)) {
    dirs.push(DIST_IMAGES_DIR);
  }
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn(`[AssetManager] Warning creating dir ${dir}:`, err);
      }
    }
  });
}

// Initial directory setup
ensureStorageDirectories();

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

/**
 * Atomically saves an uploaded PDF resume, creates a version entry,
 * mirrors to public/resume.pdf, data/uploaded-resume.pdf, dist/resume.pdf,
 * and uploads to durable cloud storage if configured.
 */
export async function saveUploadedResume(
  buffer: Buffer,
  originalFileName: string = 'Sai_Nithin_Reddy_Resume.pdf',
  customFileSize?: string
) {
  ensureStorageDirectories();

  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error('Resume PDF exceeds the 15 MB maximum size limit.');
  }

  if (!isValidPdf(buffer)) {
    throw new Error('Invalid file format. The uploaded file does not contain a valid PDF signature (%PDF-).');
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

  // Write version file to persistent archive
  fs.writeFileSync(versionFilePath, buffer);

  // Atomic mirror to active locations
  const activeDataPath = path.join(DATA_DIR, 'uploaded-resume.pdf');
  const activePublicPath = path.join(PUBLIC_DIR, 'resume.pdf');
  fs.writeFileSync(activeDataPath, buffer);
  try {
    fs.writeFileSync(activePublicPath, buffer);
  } catch (err) {
    console.warn('[AssetManager] Could not mirror to public/resume.pdf:', err);
  }
  if (fs.existsSync(DIST_DIR)) {
    try {
      fs.writeFileSync(path.join(DIST_DIR, 'resume.pdf'), buffer);
    } catch {}
  }

  // Attempt durable cloud storage upload (Supabase Free Tier)
  const cloudResult = await uploadAssetToStorage(buffer, originalFileName, 'resume');
  // Stable public HTTPS path served locally by the application
  const activeFileUrl = '/resume.pdf';

  const sizeStr = customFileSize || formatFileSize(buffer.length);
  const store = getPortfolioStore();

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

  savePortfolioStore(store);

  return {
    success: true,
    resume: store.content.profile.resume,
    version: newVersion,
    storageProvider: cloudResult.provider,
  };
}

/**
 * Rolls back to a previous resume version
 */
export function rollbackResumeVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new Error('Invalid resume version ID format.');
  }
  ensureStorageDirectories();
  const store = getPortfolioStore();
  const versions = store.content.profile.resume.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new Error(`Resume version ${versionId} not found in history.`);
  }

  const versionFileName = `resume-${versionId}.pdf`;
  const versionFilePath = path.join(RESUMES_DIR, versionFileName);

  if (!fs.existsSync(versionFilePath)) {
    throw new Error(`Archived resume file for version ${versionId} is missing on disk.`);
  }

  const buffer = fs.readFileSync(versionFilePath);
  const activeDataPath = path.join(DATA_DIR, 'uploaded-resume.pdf');
  const activePublicPath = path.join(PUBLIC_DIR, 'resume.pdf');
  fs.writeFileSync(activeDataPath, buffer);
  try {
    fs.writeFileSync(activePublicPath, buffer);
  } catch (err) {
    console.warn('[AssetManager] Could not mirror to public/resume.pdf:', err);
  }
  if (fs.existsSync(DIST_DIR)) {
    try {
      fs.writeFileSync(path.join(DIST_DIR, 'resume.pdf'), buffer);
    } catch {}
  }

  const updatedVersions = versions.map((v) => ({
    ...v,
    isActive: v.id === versionId,
  }));

  const rollbackUrl = '/resume.pdf';

  store.content.profile.resume = {
    ...store.content.profile.resume,
    fileUrl: rollbackUrl,
    fileName: target.fileName || 'Sai_Nithin_Reddy_Resume.pdf',
    fileSize: target.fileSize,
    uploadedAt: target.uploadedAt,
    isAvailable: true,
    versions: updatedVersions,
  };

  savePortfolioStore(store);
  return {
    success: true,
    resume: store.content.profile.resume,
  };
}

/**
 * Deletes a historical resume version
 */
export function deleteResumeVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new Error('Invalid resume version ID format.');
  }
  const store = getPortfolioStore();
  const versions = store.content.profile.resume.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new Error(`Resume version ${versionId} not found.`);
  }

  if (target.isActive) {
    throw new Error('Cannot delete the currently active published resume version. Switch to another version first.');
  }

  const versionFileName = `resume-${versionId}.pdf`;
  const versionFilePath = path.join(RESUMES_DIR, versionFileName);
  if (fs.existsSync(versionFilePath)) {
    try {
      fs.unlinkSync(versionFilePath);
    } catch {
      // ignore unlink failure
    }
  }

  store.content.profile.resume.versions = versions.filter((v) => v.id !== versionId);
  savePortfolioStore(store);

  return {
    success: true,
    versions: store.content.profile.resume.versions,
  };
}

/**
 * Retrieves the currently active resume file buffer or path.
 * Prioritizes local disk files first for speed, stability, and zero CORS/iframe restrictions.
 */
export function getActiveResumeFile(): {
  found: boolean;
  filePath?: string;
  buffer?: Buffer;
  externalUrl?: string;
} {
  const store = getPortfolioStore();

  const searchPaths = [
    path.join(PUBLIC_DIR, 'resume.pdf'),
    path.join(DATA_DIR, 'uploaded-resume.pdf'),
    path.join(DIST_DIR, 'resume.pdf'),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const stat = fs.statSync(p);
        if (stat.size > 1000) {
          return { found: true, filePath: p };
        }
      } catch {}
    }
  }

  // Check version history for active version
  const versions = store.content.profile.resume.versions || [];
  const activeVer = versions.find((v) => v.isActive) || versions[0];
  if (activeVer) {
    const vPath = path.join(RESUMES_DIR, `resume-${activeVer.id}.pdf`);
    if (fs.existsSync(vPath)) {
      try {
        const stat = fs.statSync(vPath);
        if (stat.size > 1000) {
          return { found: true, filePath: vPath };
        }
      } catch {}
    }
  }

  const fileUrl = store.content.profile.resume.fileUrl;
  if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
    return { found: true, externalUrl: fileUrl };
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
    throw new Error('File buffer is too small to be a valid image.');
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
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

  throw new Error('Unsupported image format. Please upload a standard JPEG, PNG, or WEBP image.');
}

/**
 * Saves an uploaded profile photo, creates a version entry,
 * mirrors to data/, public/images/, and dist/images/,
 * and uploads to durable cloud storage if configured.
 */
export async function saveUploadedPhoto(
  buffer: Buffer,
  originalFileName: string = 'portrait.png',
  altText?: string
) {
  ensureStorageDirectories();

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Profile photo exceeds 10 MB maximum limit.');
  }

  const { ext, mime } = validateImageSignature(buffer);

  const versionId = `photo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const versionFileName = `${versionId}.${ext}`;
  const versionFilePath = path.join(PHOTOS_DIR, versionFileName);

  // Write version file
  fs.writeFileSync(versionFilePath, buffer);

  // Write to active local paths
  const activeDataPath = path.join(DATA_DIR, `profile-photo.${ext}`);
  const activePublicPath = path.join(PUBLIC_IMAGES_DIR, `profile-photo.${ext}`);
  fs.writeFileSync(activeDataPath, buffer);
  try {
    fs.writeFileSync(activePublicPath, buffer);
  } catch (err) {
    console.warn('[AssetManager] Could not mirror photo to public/images:', err);
  }
  if (fs.existsSync(DIST_IMAGES_DIR)) {
    try {
      fs.writeFileSync(path.join(DIST_IMAGES_DIR, `profile-photo.${ext}`), buffer);
    } catch {}
  }

  // Clean other extensions in active dirs
  const allExts = ['png', 'jpg', 'jpeg', 'webp'];
  [DATA_DIR, PUBLIC_IMAGES_DIR, DIST_IMAGES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    allExts.forEach((otherExt) => {
      if (otherExt !== ext) {
        const p = path.join(dir, `profile-photo.${otherExt}`);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch {}
        }
      }
    });
  });

  // Attempt durable cloud storage upload (Supabase Free Tier)
  const cloudResult = await uploadAssetToStorage(buffer, originalFileName, 'photo');
  const photoUrl = cloudResult.success && cloudResult.url && !cloudResult.url.startsWith('/')
    ? cloudResult.url
    : `/api/portfolio/photo?v=${Date.now()}`;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const store = getPortfolioStore();

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

  savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
    version: newVersion,
    storageProvider: cloudResult.provider,
    mime,
  };
}

/**
 * Rolls back to a previous photo version
 */
export function rollbackPhotoVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new Error('Invalid photo version ID format.');
  }
  ensureStorageDirectories();
  const store = getPortfolioStore();
  const versions = store.content.profile.photo.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new Error(`Photo version ${versionId} not found in history.`);
  }

  // Find file on disk in PHOTOS_DIR
  const files = fs.readdirSync(PHOTOS_DIR);
  const matchedFile = files.find((f) => f.startsWith(versionId));
  if (!matchedFile) {
    throw new Error(`Archived photo file for version ${versionId} is missing on disk.`);
  }

  const ext = path.extname(matchedFile).replace('.', '');
  const buffer = fs.readFileSync(path.join(PHOTOS_DIR, matchedFile));

  // Mirror to active paths
  const activeDataPath = path.join(DATA_DIR, `profile-photo.${ext}`);
  const activePublicPath = path.join(PUBLIC_IMAGES_DIR, `profile-photo.${ext}`);
  fs.writeFileSync(activeDataPath, buffer);
  try {
    fs.writeFileSync(activePublicPath, buffer);
  } catch {}
  if (fs.existsSync(DIST_IMAGES_DIR)) {
    try {
      fs.writeFileSync(path.join(DIST_IMAGES_DIR, `profile-photo.${ext}`), buffer);
    } catch {}
  }

  const allExts = ['png', 'jpg', 'jpeg', 'webp'];
  [DATA_DIR, PUBLIC_IMAGES_DIR, DIST_IMAGES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    allExts.forEach((otherExt) => {
      if (otherExt !== ext) {
        const p = path.join(dir, `profile-photo.${otherExt}`);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch {}
        }
      }
    });
  });

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

  savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
  };
}

/**
 * Resets profile photo to default permanent portrait asset
 */
export function resetPhotoToPlaceholder() {
  ensureStorageDirectories();
  const store = getPortfolioStore();

  const versions = (store.content.profile.photo.versions || []).map((v) => ({
    ...v,
    isActive: false,
  }));

  // Point to permanent default uploaded photo asset
  const defaultUrl = '/images/default-profile.png';

  store.content.profile.photo = {
    url: defaultUrl,
    altText: `Portrait of ${store.content.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
    showInHero: true,
    showInAbout: false,
    isPlaceholder: false,
    versions,
  };

  savePortfolioStore(store);

  return {
    success: true,
    photo: store.content.profile.photo,
  };
}

/**
 * Deletes a historical photo version
 */
export function deletePhotoVersion(versionId: string) {
  if (!versionId || !/^[a-zA-Z0-9_-]+$/.test(versionId)) {
    throw new Error('Invalid photo version ID format.');
  }
  const store = getPortfolioStore();
  const versions = store.content.profile.photo.versions || [];
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    throw new Error(`Photo version ${versionId} not found.`);
  }

  if (target.isActive) {
    throw new Error('Cannot delete the currently active profile photo version. Switch to another photo first.');
  }

  if (fs.existsSync(PHOTOS_DIR)) {
    const files = fs.readdirSync(PHOTOS_DIR);
    const matched = files.filter((f) => f.startsWith(versionId));
    matched.forEach((f) => {
      try { fs.unlinkSync(path.join(PHOTOS_DIR, f)); } catch {}
    });
  }

  store.content.profile.photo.versions = versions.filter((v) => v.id !== versionId);
  savePortfolioStore(store);

  return {
    success: true,
    versions: store.content.profile.photo.versions,
  };
}

/**
 * Gets active photo file on disk.
 * Searches DATA_DIR, PUBLIC_IMAGES_DIR, and DIST_IMAGES_DIR.
 * Falls back to default-profile.png (the user's permanent uploaded portrait).
 */
export function getActivePhotoFile(): { found: boolean; filePath?: string; mime?: string } {
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
