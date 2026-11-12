// Server-side environment access shared by local and hosted deployments.
export function env(name: string): string | undefined {
  return process.env[name];
}
