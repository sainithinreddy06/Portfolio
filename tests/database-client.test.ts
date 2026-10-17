import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// Exercise the actual Drizzle server transport without network access or DB writes.
const queryCalls: unknown[][] = [];
const pool = {
  query: async (...args: unknown[]) => {
    queryCalls.push(args);
    return { rows: [['main', { version: 1 }]] };
  },
};
mock.module('@netlify/database', { namedExports: { getDatabase: () => ({ driver: 'server', pool }) } });
const { getDb } = await import('../db/index');
const { portfolio } = await import('../db/schema');

test('Drizzle uses the native platform server transport without implicit Neon HTTP initialization', async () => {
  const savedUrl = process.env.NETLIFY_DB_URL;
  delete process.env.NETLIFY_DB_URL;
  try {
    const result = await getDb().select().from(portfolio);
    assert.deepEqual(result, [{ id: 'main', state: { version: 1 } }]);
    assert.equal(queryCalls.length, 1);
  } finally {
    if (savedUrl !== undefined) process.env.NETLIFY_DB_URL = savedUrl;
  }
});
