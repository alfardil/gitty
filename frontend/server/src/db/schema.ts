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
  decimal,
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

export const enterpriseRole = pgEnum("enterprise_role", ["admin", "member"]);

export const enterprises = pgTable("enterprises", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }),
});

export const enterpriseUsers = pgTable(
  "enterprise_users",
  {
    enterpriseId: uuid("enterprise_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: enterpriseRole("role").default("member").notNull(),
    joinedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.enterpriseId, table.userId],
      name: "enterprise_users_pk",
    }),
    foreignKey({
      columns: [table.enterpriseId],
      foreignColumns: [enterprises.id],
      name: "enterprise_users_enterprise_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "enterprise_users_user_id_fk",
    }),
  ]
);

export const enterpriseInviteCodes = pgTable(
  "enterprise_invite_codes",
  {
    code: varchar({ length: 64 }).primaryKey().notNull(),
    enterpriseId: uuid("enterprise_id").notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    expiresAt: timestamp({ mode: "string" }),
    used: boolean().default(false).notNull(),
    usedBy: uuid("used_by"),
    usedAt: timestamp({ mode: "string" }),
    role: enterpriseRole("role").default("member").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.enterpriseId],
      foreignColumns: [enterprises.id],
      name: "invite_codes_enterprise_id_fk",
    }),
    foreignKey({
      columns: [table.usedBy],
      foreignColumns: [users.id],
      name: "invite_codes_used_by_fk",
    }),
  ]
);

export const taskStatus = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "pending_pr_approval",
  "done",
]);

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    status: taskStatus("status").default("not_started").notNull(),
    priority: taskPriority("priority").default("medium").notNull(),
    dueDate: timestamp({ mode: "string" }),
    assigneeId: uuid("assignee_id"),
    createdById: uuid("created_by_id").notNull(),
    enterpriseId: uuid("enterprise_id"),
    tags: text().array(),
    position: decimal("position", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    completedAt: timestamp({ mode: "string" }),
    assignedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [users.id],
      name: "tasks_assignee_id_fk",
    }),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "tasks_created_by_id_fk",
    }),
    foreignKey({
      columns: [table.enterpriseId],
      foreignColumns: [enterprises.id],
      name: "tasks_enterprise_id_fk",
    }),
  ]
);

// Track task assignment history
export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    assigneeId: uuid("assignee_id").notNull(),
    assignedById: uuid("assigned_by_id").notNull(),
    assignedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    unassignedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_assignments_task_id_fk",
    }),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [users.id],
      name: "task_assignments_assignee_id_fk",
    }),
    foreignKey({
      columns: [table.assignedById],
      foreignColumns: [users.id],
      name: "task_assignments_assigned_by_id_fk",
    }),
  ]
);
