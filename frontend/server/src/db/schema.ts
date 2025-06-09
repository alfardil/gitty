import {
  integer,
  pgTable,
  varchar,
  timestamp,
  uuid as uuidType,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  githubId: varchar({ length: 32 }).notNull().unique(),
  uuid: uuidType().defaultRandom().notNull().unique(),
  githubUsername: varchar({ length: 255 }),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  joinedAt: timestamp().defaultNow().notNull(),
  avatarUrl: varchar({ length: 512 }),
  bio: varchar({ length: 512 }),
});

export const sessionsTable = pgTable("sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull(),
  expiresAt: timestamp().notNull(),
  deletedAt: timestamp(),
});
