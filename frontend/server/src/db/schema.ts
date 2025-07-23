import {
  pgTable,
  uuid,
  text,
  vector,
  unique,
  varchar,
  timestamp,
  boolean,
  integer,
  foreignKey,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const subscriptionPlan = pgEnum("subscription_plan", [
  "FREE",
  "PRO",
  "ENTERPRISE",
]);

export const repoChunks = pgTable("repo_chunks", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  repoHash: text("repo_hash"),
  source: text(),
  chunk: text(),
  embedding: vector({ dimensions: 1536 }),
});

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    githubId: varchar({ length: 32 }).notNull(),
    githubUsername: varchar({ length: 255 }),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    email: varchar({ length: 255 }).notNull(),
    joinedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    avatarUrl: varchar({ length: 512 }),
    bio: varchar({ length: 512 }),
    developer: boolean().default(false).notNull(),
    username: varchar({ length: 255 }),
    analyzedReposCount: integer().default(0),
    subscriptionPlan: subscriptionPlan("subscription_plan").default("FREE"),
  },
  (table) => [
    unique("users_githubId_unique").on(table.githubId),
    unique("users_email_unique").on(table.email),
    unique("users_username_unique").on(table.username),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    expiresAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "sessions_user_id_users_id_fk",
    }),
  ]
);

export const waitlistEmails = pgTable(
  "waitlist_emails",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: varchar({ length: 255 }).notNull(),
    addedAt: timestamp("added_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [unique("waitlist_emails_email_unique").on(table.email)]
);

export const diagramCache = pgTable(
  "diagram_cache",
  {
    username: varchar({ length: 256 }).notNull(),
    repo: varchar({ length: 256 }).notNull(),
    diagram: varchar({ length: 10000 }).notNull(),
    explanation: varchar({ length: 10000 })
      .default("No explanation provided")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    primaryKey({
      columns: [table.username, table.repo],
      name: "diagram_cache_username_repo_pk",
    }),
  ]
);
