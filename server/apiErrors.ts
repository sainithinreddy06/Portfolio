// Log only known categories. Never log exception messages, request bodies, or credentials.
export function reportApiFailure(operation: string, error: unknown) {
  const codes = ['ENOENT', 'EROFS', 'EACCES', 'ECONNREFUSED', 'ETIMEDOUT', '42P01', 'GITHUB_DISCOVERY_FAILED'];
  let category = 'INTERNAL_SERVICE_ERROR';
  const seen = new Set<unknown>();
  for (let current = error as any; current && !seen.has(current); current = current.cause) {
    seen.add(current);
    if (codes.includes(current.code)) { category = current.code; break; }
    if (current.name === 'MissingDatabaseConnectionError') category = 'DATABASE_CONNECTION_MISSING';
    if (current.name === 'NeonDbError') category = 'DATABASE_TRANSPORT_ERROR';
  }
  console.error(JSON.stringify({ operation, category }));
}
