import { getDatabase } from '@netlify/database';
import { drizzle } from 'drizzle-orm/netlify-db';
import * as schema from './schema.js';
import { env } from '../server/runtimeEnv.js';

let cachedDb: any = null;
let cachedConnectionKey: string | null = null;

export function getDb(): any {
  const connectionString = env('NETLIFY_DB_URL') || env('DATABASE_URL');
  const connectionKey = connectionString || '__default__';

  if (cachedDb && cachedConnectionKey === connectionKey) {
    return cachedDb;
  }

  // Let the platform select its transport and read invocation-scoped credentials.
  const client = connectionString ? getDatabase({ connectionString }) : getDatabase();
  cachedDb = (drizzle as any)({ client, schema });
  cachedConnectionKey = connectionKey;
  return cachedDb;
}
