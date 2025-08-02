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
    projectId: uuid("project_id"), // Link tasks to projects
    tags: text().array(),
    position: decimal("position", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    completedAt: timestamp({ mode: "string" }),
    assignedAt: timestamp({ mode: "string" }),

    // Future AI/analytics features - currently unused
    // These fields will be used for:
    // - Time estimation accuracy (estimatedHours, actualHours, originalEstimate)
    // - Task complexity analysis (complexity, taskType)
    // - Dependency management (dependencies, blockers)
    // - Quality metrics (reworkCount, approvalCount)
    // - Scope management (scopeChanges)
    // - Timeline tracking (startedAt, lastStatusChangeAt)
    startedAt: timestamp({ mode: "string" }),
    estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
    actualHours: decimal("actual_hours", { precision: 8, scale: 2 }),
    complexity: integer("complexity"),
    taskType: varchar("task_type", { length: 50 }),
    dependencies: uuid("dependencies").array(),
    blockers: uuid("blockers").array(),
    reworkCount: integer("rework_count").default(0),
    approvalCount: integer("approval_count").default(0),
    lastStatusChangeAt: timestamp({ mode: "string" }),
    originalEstimate: decimal("original_estimate", { precision: 8, scale: 2 }),
    scopeChanges: integer("scope_changes").default(0),
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
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "tasks_project_id_fk",
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

// Track task status changes for timeline analysis
export const taskStatusHistory = pgTable(
  "task_status_history",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    fromStatus: taskStatus("from_status"),
    toStatus: taskStatus("to_status").notNull(),
    changedById: uuid("changed_by_id").notNull(),
    changedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    notes: text(), // Optional notes about the status change
  },
  (table) => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_status_history_task_id_fk",
    }),
    foreignKey({
      columns: [table.changedById],
      foreignColumns: [users.id],
      name: "task_status_history_changed_by_id_fk",
    }),
  ]
);

// Track time spent on tasks for velocity calculations
export const taskTimeEntries = pgTable(
  "task_time_entries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    userId: uuid("user_id").notNull(),
    startedAt: timestamp({ mode: "string" }).notNull(),
    endedAt: timestamp({ mode: "string" }),
    hours: decimal("hours", { precision: 8, scale: 2 }),
    description: text(), // What was worked on during this time
  },
  (table) => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_time_entries_task_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "task_time_entries_user_id_fk",
    }),
  ]
);

// Projects table for grouping related tasks
export const projects = pgTable(
  "projects",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    enterpriseId: uuid("enterprise_id").notNull(),
    createdById: uuid("created_by_id").notNull(),
    memberIds: uuid("member_ids").array(), // Direct reference to project members
    status: varchar("status", { length: 50 }).default("active").notNull(), // active, completed, paused, cancelled
    startDate: timestamp({ mode: "string" }),
    targetEndDate: timestamp({ mode: "string" }),
    actualEndDate: timestamp({ mode: "string" }),
    estimatedTotalHours: decimal("estimated_total_hours", {
      precision: 10,
      scale: 2,
    }),
    actualTotalHours: decimal("actual_total_hours", {
      precision: 10,
      scale: 2,
    }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.enterpriseId],
      foreignColumns: [enterprises.id],
      name: "projects_enterprise_id_fk",
    }),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "projects_created_by_id_fk",
    }),
  ]
);

// Project members table
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    projectId: uuid("project_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(), // owner, lead, member
    joinedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    leftAt: timestamp({ mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_members_project_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "project_members_user_id_fk",
    }),
  ]
);

// Performance insights storage
export const performanceInsights = pgTable(
  "performance_insights",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    enterpriseId: uuid("enterprise_id").notNull(),
    projectId: uuid("project_id"),
    overallScore: decimal("overallScore", {
      precision: 5,
      scale: 2,
    }).notNull(),
    performanceGrade: varchar("performanceGrade", { length: 10 }).notNull(),
    criticalIssues: text().array().notNull(),
    strengths: text().array().notNull(),
    recommendations: text().array().notNull(),
    detailedAnalysis: text().notNull(), // JSON string of detailed analysis
    generatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    generatedBy: uuid("generated_by").notNull(), // Admin who generated the insight
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "performance_insights_user_id_fk",
    }),
    foreignKey({
      columns: [table.enterpriseId],
      foreignColumns: [enterprises.id],
      name: "performance_insights_enterprise_id_fk",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "performance_insights_project_id_fk",
    }),
    foreignKey({
      columns: [table.generatedBy],
      foreignColumns: [users.id],
      name: "performance_insights_generated_by_fk",
    }),
  ]
);
