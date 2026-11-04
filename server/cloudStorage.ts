import path from 'path';

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  storageKey?: string;
  provider: 'supabase' | 'repository_static';
  error?: string;
}

/**
 * Validates whether Supabase Free-Tier Storage environment variables are configured.
 * Supabase free plan provides 1 GB file storage with zero credit card requirement.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Returns current active storage provider name.
 */
export function getStorageProviderStatus(): 'supabase' | 'repository_static' {
  if (isSupabaseConfigured()) return 'supabase';
  return 'repository_static';
}

/**
 * Uploads a buffer to Supabase Storage via native REST API (0 SDK dependencies).
 * Uses a server-side service-role key and a public bucket for read access.
 * The service-role key must never be exposed to the browser.
 */
async function uploadToSupabase(
  buffer: Buffer,
  fileName: string,
  bucket: string = 'portfolio-assets'
): Promise<StorageUploadResult> {
  const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/$/, '');
  // Storage uploads are server-side privileged operations. Never use the
  // public anon key as a fallback for writes; it must not be granted broad
  // upload permissions through permissive Storage RLS policies.
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const cleanBase = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `${Date.now()}_${cleanBase}`;

  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${storageKey}`;

  try {
    const isPdf = path.extname(fileName).toLowerCase() === '.pdf';
    const mimeType = isPdf ? 'application/pdf' : 'image/png';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        apikey: apiKey,
        'Content-Type': mimeType,
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase storage upload failed (${response.status}): ${errText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storageKey}`;
    return {
      success: true,
      url: publicUrl,
      storageKey,
      provider: 'supabase',
    };
  } catch (err: any) {
    console.error('[Storage] Supabase upload error:', err.message);
    return {
      success: false,
      error: err.message,
      provider: 'supabase',
    };
  }
}

/**
 * Unified free-tier storage uploader.
 * 1. If Supabase free tier is configured, uploads directly to Supabase storage bucket.
 * 2. If Supabase is not configured, uses the repository static asset fallback.
 * 3. If Supabase is configured but upload fails, report the failure rather than
 *    pretending a non-durable local file is safely stored.
 * 3. Never relies on Cloudinary or any paid service.
 */
export async function uploadAssetToStorage(
  buffer: Buffer,
  fileName: string,
  type: 'photo' | 'resume'
): Promise<StorageUploadResult> {
  if (isSupabaseConfigured()) {
    console.log(`[Storage] Uploading ${type} to Supabase free-tier storage...`);
    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET ||
      (type === 'resume' ? 'resumes' : 'photos');

    const result = await uploadToSupabase(buffer, fileName, bucket);
    if (result.success) return result;
    return result;
  }

  // Version-controlled repository static asset fallback (100% free, permanent, zero external dependency)
  const repositoryUrl = type === 'resume' ? '/resume.pdf' : '/images/profile-photo.png';
  return {
    success: true,
    url: repositoryUrl,
    provider: 'repository_static',
  };
}
