CREATE TABLE "admin_login_attempts" (
	"ip" text PRIMARY KEY,
	"count" integer NOT NULL,
	"first_attempt" bigint NOT NULL,
	"blocked_until" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio" (
	"id" text PRIMARY KEY,
	"state" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"token_hash" text PRIMARY KEY,
	"user" text NOT NULL,
	"expires_at" bigint NOT NULL
);
