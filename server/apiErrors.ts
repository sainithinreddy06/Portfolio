// Log only known categories. Never log exception messages, request bodies, or credentials.
export function reportApiFailure(operation: string, error: unknown) {
  const code = (error as { code?: string })?.code;
  const category = ['ENOENT', 'EROFS', 'EACCES', 'ECONNREFUSED', 'ETIMEDOUT', '42P01', 'GITHUB_DISCOVERY_FAILED'].includes(code || '') ? code : 'INTERNAL_SERVICE_ERROR';
  console.error(JSON.stringify({ operation, category }));
}
