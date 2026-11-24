// Only API resources and the active resume move when the frontend is hosted separately.
export function serverResourceUrl(path: string, origin = import.meta.env?.VITE_API_ORIGIN): string {
  if (!origin || !(path.startsWith('/api/') || path === '/resume.pdf')) return path;
  const base = new URL(origin);
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash ||
      !(base.protocol === 'https:' || (base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) {
    throw new Error('VITE_API_ORIGIN must be an HTTPS origin or a local development origin.');
  }
  return base.origin + path;
}

export async function readApiJson(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`API returned an unexpected response (HTTP ${response.status}). Please retry or contact the administrator.`);
  }
  try { return await response.json(); } catch {
    throw new Error(`API returned invalid JSON (HTTP ${response.status}). Please retry.`);
  }
}
