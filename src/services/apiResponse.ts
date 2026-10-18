export async function readApiJson(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`API returned an unexpected response (HTTP ${response.status}). Please retry or contact the administrator.`);
  }
  try { return await response.json(); } catch {
    throw new Error(`API returned invalid JSON (HTTP ${response.status}). Please retry.`);
  }
}
