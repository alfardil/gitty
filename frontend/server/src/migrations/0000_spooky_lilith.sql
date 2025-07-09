CREATE TABLE IF NOT EXISTS "diagram_cache" (
	"username" varchar(256) NOT NULL,
	"repo" varchar(256) NOT NULL,
	"diagram" varchar(10000) NOT NULL,
	"explanation" varchar(10000) DEFAULT 'No explanation provided' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "diagram_cache_username_repo_pk" PRIMARY KEY("username","repo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS"sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"githubId" varchar(32) NOT NULL,
	"githubUsername" varchar(255),
	"firstName" varchar(255),
	"lastName" varchar(255),
	"email" varchar(255) NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"avatarUrl" varchar(512),
	"bio" varchar(512),
	"admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_githubId_unique" UNIQUE("githubId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_emails_id_unique" UNIQUE("id"),
	CONSTRAINT "waitlist_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- these migrations do not work with drizzle, so we need to run them manually
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repo_chunks" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_hash TEXT,
    source TEXT,
    chunk TEXT,
    embedding vector(1536)
);

-- do this after the first migration
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "repo_chunks_cos_idx"
ON "repo_chunks" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE "repo_chunks";