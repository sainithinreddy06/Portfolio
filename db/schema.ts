import { pgTable, text, jsonb, bigint, integer } from 'drizzle-orm/pg-core';
import type { PortfolioStoreState } from '../server/types';
export const portfolio = pgTable('portfolio', {
  id: text().primaryKey(),
  state: jsonb().$type<PortfolioStoreState>().notNull(),
});
export const sessions = pgTable('admin_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  user: text().notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});
export const loginAttempts = pgTable('admin_login_attempts', {
  ip: text().primaryKey(),
  count: integer().notNull(),
  firstAttempt: bigint('first_attempt', { mode: 'number' }).notNull(),
  blockedUntil: bigint('blocked_until', { mode: 'number' }).notNull(),
});
