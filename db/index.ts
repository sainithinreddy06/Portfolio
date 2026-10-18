import { getDatabase } from '@netlify/database';
import { drizzle } from 'drizzle-orm/netlify-db';
import * as schema from './schema.js';

export function getDb() {
  // Let the platform select its transport and read invocation-scoped credentials.
  // Drizzle's implicit connection assumes Neon HTTP when the driver is unset.
  return drizzle({ client: getDatabase(), schema });
}
