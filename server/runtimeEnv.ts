// Netlify invocation-scoped environment; process.env supports the local Express server.
export function env(name: string): string | undefined {
  const runtime = (globalThis as typeof globalThis & { Netlify?: { env: { get(name: string): string | undefined } } }).Netlify;
  return runtime ? runtime.env.get(name) : process.env[name];
}
