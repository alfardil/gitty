CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS vector   WITH SCHEMA public;

CREATE TYPE "public"."enterprise_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('FREE', 'PRO', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'pending_pr_approval', 'done');--> statement-breakpoint
CREATE TABLE "diagram_cache" (
	"username" varchar(256) NOT NULL,
	"repo" varchar(256) NOT NULL,
	"diagram" varchar(10000) NOT NULL,
	"explanation" varchar(10000) DEFAULT 'No explanation provided' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "diagram_cache_username_repo_pk" PRIMARY KEY("username","repo")
);
--> statement-breakpoint
CREATE TABLE "enterprise_invite_codes" (
	"code" varchar(64) PRIMARY KEY NOT NULL,
	"enterprise_id" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"used" boolean DEFAULT false NOT NULL,
	"used_by" uuid,
	"usedAt" timestamp,
	"role" "enterprise_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_users" (
	"enterprise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "enterprise_role" DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enterprise_users_pk" PRIMARY KEY("enterprise_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "enterprises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "performance_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"enterprise_id" uuid NOT NULL,
	"project_id" uuid,
	"overallScore" numeric(5, 2) NOT NULL,
	"performanceGrade" varchar(10) NOT NULL,
	"criticalIssues" text[] NOT NULL,
	"strengths" text[] NOT NULL,
	"recommendations" text[] NOT NULL,
	"detailedAnalysis" text NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"generated_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"enterprise_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"member_ids" uuid[],
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"startDate" timestamp,
	"targetEndDate" timestamp,
	"actualEndDate" timestamp,
	"estimated_total_hours" numeric(10, 2),
	"actual_total_hours" numeric(10, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_hash" text,
	"source" text,
	"chunk" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"unassignedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"from_status" "task_status",
	"to_status" "task_status" NOT NULL,
	"changed_by_id" uuid NOT NULL,
	"changedAt" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "task_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"startedAt" timestamp NOT NULL,
	"endedAt" timestamp,
	"hours" numeric(8, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"dueDate" timestamp,
	"assignee_id" uuid,
	"created_by_id" uuid NOT NULL,
	"enterprise_id" uuid,
	"project_id" uuid,
	"tags" text[],
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"assignedAt" timestamp,
	"startedAt" timestamp,
	"estimated_hours" numeric(8, 2),
	"actual_hours" numeric(8, 2),
	"complexity" integer,
	"task_type" varchar(50),
	"dependencies" uuid[],
	"blockers" uuid[],
	"rework_count" integer DEFAULT 0,
	"approval_count" integer DEFAULT 0,
	"lastStatusChangeAt" timestamp,
	"original_estimate" numeric(8, 2),
	"scope_changes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"githubId" varchar(32) NOT NULL,
	"githubUsername" varchar(255),
	"firstName" varchar(255),
	"lastName" varchar(255),
	"email" varchar(255) NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"avatarUrl" varchar(512),
	"bio" varchar(512),
	"developer" boolean DEFAULT false NOT NULL,
	"username" varchar(255),
	"analyzedReposCount" integer DEFAULT 0,
	"subscription_plan" "subscription_plan" DEFAULT 'FREE',
	CONSTRAINT "users_githubId_unique" UNIQUE("githubId"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "waitlist_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "enterprise_invite_codes" ADD CONSTRAINT "invite_codes_enterprise_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_invite_codes" ADD CONSTRAINT "invite_codes_used_by_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_users" ADD CONSTRAINT "enterprise_users_enterprise_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_users" ADD CONSTRAINT "enterprise_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_insights" ADD CONSTRAINT "performance_insights_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_insights" ADD CONSTRAINT "performance_insights_enterprise_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_insights" ADD CONSTRAINT "performance_insights_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_insights" ADD CONSTRAINT "performance_insights_generated_by_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_enterprise_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignee_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assigned_by_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_changed_by_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_enterprise_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;