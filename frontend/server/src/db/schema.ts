import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  primaryKey,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: varchar({ length: 32 }).notNull().unique(),
  githubUsername: varchar({ length: 255 }),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  joinedAt: timestamp().defaultNow().notNull(),
  avatarUrl: varchar({ length: 512 }),
  bio: varchar({ length: 512 }),
  admin: boolean().default(false).notNull(),
});

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  expiresAt: timestamp().notNull(),
  deletedAt: timestamp(),
});

export const diagramCache = pgTable(
  "diagram_cache",
  {
    username: varchar("username", { length: 256 }).notNull(),
    repo: varchar("repo", { length: 256 }).notNull(),
    diagram: varchar("diagram", { length: 10000 }).notNull(),
    explanation: varchar("explanation", { length: 10000 })
      .notNull()
      .default("No explanation provided"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.username, table.repo] }),
  })
);

export const waitlistEmails = pgTable("waitlist_emails", {
  id: uuid("id").primaryKey().defaultRandom().notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});
