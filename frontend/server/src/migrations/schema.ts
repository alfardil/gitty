import { pgTable, varchar, uuid, timestamp, boolean, numeric, text, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const enterpriseRole = pgEnum("enterprise_role", ['admin', 'member'])
export const seatStatus = pgEnum("seat_status", ['available', 'assigned', 'inactive'])
export const subscriptionPlan = pgEnum("subscription_plan", ['FREE', 'PRO', 'ENTERPRISE'])
export const taskPriority = pgEnum("task_priority", ['low', 'medium', 'high'])
export const taskStatus = pgEnum("task_status", ['not_started', 'in_progress', 'pending_pr_approval', 'done'])


export const enterpriseInviteCodes = pgTable("enterprise_invite_codes", {
	code: varchar({ length: 64 }).primaryKey().notNull(),
	enterpriseId: uuid("enterprise_id").notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	used: boolean().default(false).notNull(),
	usedBy: uuid("used_by"),
	usedAt: timestamp({ mode: 'string' }),
	role: enterpriseRole().default('member').notNull(),
});

export const enterprises = pgTable("enterprises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }),
});

export const performanceInsights = pgTable("performance_insights", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	enterpriseId: uuid("enterprise_id").notNull(),
	projectId: uuid("project_id"),
	overallScore: numeric({ precision: 5, scale:  2 }).notNull(),
	performanceGrade: varchar({ length: 10 }).notNull(),
	criticalIssues: text().array().notNull(),
	strengths: text().array().notNull(),
	recommendations: text().array().notNull(),
	detailedAnalysis: text().notNull(),
	generatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	generatedBy: uuid("generated_by").notNull(),
});

export const projectMembers = pgTable("project_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 50 }).default('member').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp({ mode: 'string' }),
});

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	enterpriseId: uuid("enterprise_id").notNull(),
	createdById: uuid("created_by_id").notNull(),
	memberIds: uuid("member_ids").array(),
	status: varchar({ length: 50 }).default('active').notNull(),
	startDate: timestamp({ mode: 'string' }),
	targetEndDate: timestamp({ mode: 'string' }),
	actualEndDate: timestamp({ mode: 'string' }),
	estimatedTotalHours: numeric("estimated_total_hours", { precision: 10, scale:  2 }),
	actualTotalHours: numeric("actual_total_hours", { precision: 10, scale:  2 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const enterpriseUsers = pgTable("enterprise_users", {
	enterpriseId: uuid("enterprise_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: enterpriseRole().default('member').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.enterpriseId, table.userId], name: "enterprise_users_pk"}),
]);

export const diagramCache = pgTable("diagram_cache", {
	username: varchar({ length: 256 }).notNull(),
	repo: varchar({ length: 256 }).notNull(),
	diagram: varchar({ length: 10000 }).notNull(),
	explanation: varchar({ length: 10000 }).default('No explanation provided').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	primaryKey({ columns: [table.username, table.repo], name: "diagram_cache_username_repo_pk"}),
]);
