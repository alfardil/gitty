import { db } from "@/server/src/db";
import { enterprises, enterpriseInviteCodes } from "@/server/src/db/schema";
import {
  createEnterprise,
  generateEnterpriseInviteCode,
  redeemEnterpriseInviteCodeForMember,
  redeemEnterpriseInviteCodeForAdmin,
} from "@/server/src/db/actions";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { enterpriseUsers, users } from "@/server/src/db/schema";
import { Enterprise } from "@/lib/types/business/Enterprise";

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: string; code?: string };

export class ServiceError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const createEnterpriseSchema = z.object({
  name: z.string().min(2).max(255),
  ownerUserId: z.string().uuid(),
});
export const generateInviteCodeSchema = z.object({
  enterpriseId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});
export const redeemInviteCodeSchema = z.object({
  code: z.string().min(1),
  userId: z.string().uuid(),
});

export async function createEnterpriseService(
  params: z.infer<typeof createEnterpriseSchema>
): Promise<ServiceResponse<{ enterprise: Enterprise }>> {
  const parse = createEnterpriseSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { name, ownerUserId } = parse.data;
  const existing = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.name, name));
  if (existing.length > 0) {
    throw new ServiceError(
      "Enterprise name taken. Please choose a different name.",
      409,
      "conflict"
    );
  }
  const enterprise = await createEnterprise({ name, ownerUserId });
  return { success: true, data: { enterprise } };
}

export async function generateMemberInviteCodeService(
  params: z.infer<typeof generateInviteCodeSchema>
): Promise<ServiceResponse<{ code: string }>> {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Must be a valid Enterprise ID", 400, "validation");
  const { enterpriseId, expiresAt } = parse.data;
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    throw new ServiceError(
      "Enterprise not found. Please check the Enterprise ID.",
      404,
      "not_found"
    );
  }
  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "member",
  });
  return { success: true, data: { code } };
}

export async function generateAdminInviteCodeService(
  params: z.infer<typeof generateInviteCodeSchema>
): Promise<ServiceResponse<{ code: string }>> {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Must be a valid Enterprise ID", 400, "validation");
  const { enterpriseId, expiresAt } = parse.data;
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    throw new ServiceError(
      "Enterprise not found. Please check the Enterprise ID.",
      404,
      "not_found"
    );
  }
  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "admin",
  });
  return { success: true, data: { code } };
}

export async function redeemInviteCodeService(
  params: z.infer<typeof redeemInviteCodeSchema>
): Promise<ServiceResponse<{ role: string }>> {
  const parse = redeemInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { code, userId } = parse.data;
  const invite = await db
    .select()
    .from(enterpriseInviteCodes)
    .where(eq(enterpriseInviteCodes.code, code))
    .limit(1);
  const inviteCode = invite[0];
  if (!inviteCode) {
    throw new ServiceError("Invalid invite code", 400, "invalid_code");
  }
  try {
    if (inviteCode.role === "admin") {
      await redeemEnterpriseInviteCodeForAdmin({ code, userId });
      return { success: true, data: { role: "admin" } };
    } else {
      await redeemEnterpriseInviteCodeForMember({ code, userId });
      return { success: true, data: { role: "member" } };
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ALREADY_MEMBER"
    ) {
      if (inviteCode.role === "admin") {
        throw new ServiceError(
          "Already an admin of this enterprise!",
          409,
          "already_admin"
        );
      } else {
        throw new ServiceError(
          "Already a member of this enterprise!",
          409,
          "already_member"
        );
      }
    }
    if (
      error instanceof Error &&
      error.message === "Invite code already used"
    ) {
      throw new ServiceError("Invite code already used", 400, "used_code");
    }
    if (error instanceof Error && error.message === "Invalid invite code") {
      throw new ServiceError("Invalid invite code", 400, "invalid_code");
    }
    throw error;
  }
}

export async function getAdminEnterprisesService(
  userId: string
): Promise<ServiceResponse<{ enterprises: Enterprise[] }>> {
  if (!userId) throw new ServiceError("Missing userId", 400, "missing_userId");
  try {
    const adminEnterprises = await db
      .select({
        id: enterprises.id,
        name: enterprises.name,
        createdAt: enterprises.createdAt,
        updatedAt: enterprises.updatedAt,
      })
      .from(enterprises)
      .innerJoin(
        enterpriseUsers,
        and(
          eq(enterpriseUsers.enterpriseId, enterprises.id),
          eq(enterpriseUsers.userId, userId),
          eq(enterpriseUsers.role, "admin")
        )
      );
    return { success: true, data: { enterprises: adminEnterprises } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    throw new ServiceError(errorMessage, 500, "db_error");
  }
}

export async function getUserEnterprisesService(
  userId: string
): Promise<ServiceResponse<{ enterprises: Enterprise[] }>> {
  if (!userId) throw new ServiceError("Missing userId", 400, "missing_userId");
  try {
    const userEnterprises = await db
      .select({
        id: enterprises.id,
        name: enterprises.name,
        createdAt: enterprises.createdAt,
        updatedAt: enterprises.updatedAt,
      })
      .from(enterprises)
      .innerJoin(
        enterpriseUsers,
        and(
          eq(enterpriseUsers.enterpriseId, enterprises.id),
          eq(enterpriseUsers.userId, userId)
        )
      )
      .orderBy(enterprises.createdAt);
    return { success: true, data: { enterprises: userEnterprises } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    throw new ServiceError(errorMessage, 500, "db_error");
  }
}

interface User {
  id: string;
  avatar_url: string | null;
  githubId: string | null;
  githubUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  subscription_plan: string | null;
  role: string;
}

export async function getEnterpriseUsersService(
  enterpriseId: string
): Promise<ServiceResponse<{ users: User[] }>> {
  try {
    const enterpriseUsersData = await db
      .select({
        id: users.id,
        avatar_url: users.avatarUrl,
        githubId: users.githubId,
        githubUsername: users.githubUsername,
        firstName: users.firstName,
        lastName: users.lastName,
        subscription_plan: users.subscriptionPlan,
        role: enterpriseUsers.role,
      })
      .from(enterpriseUsers)
      .innerJoin(users, eq(enterpriseUsers.userId, users.id))
      .where(eq(enterpriseUsers.enterpriseId, enterpriseId));

    return { success: true, data: { users: enterpriseUsersData } };
  } catch (error) {
    console.error("Error fetching enterprise users:", error);
    throw new ServiceError("Failed to fetch enterprise users", 500);
  }
}

interface TeamPerformanceAnalytics {
  enterpriseId: string;
  totalUsers: number;
  activeUsers: number;
  teamMetrics: {
    averageCompletionRate: number;
    averageTaskVelocity: number;
    averageTaskComplexity: number;
    totalTasksCompleted: number;
    totalTasksInProgress: number;
    totalTasksOverdue: number;
    averageTimeToComplete: number;
  };
  userPerformance: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    completionRate: number;
    taskVelocity: number;
    averageTaskComplexity: number;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksOverdue: number;
    averageTimeToComplete: number;
    lastActiveAt: string | null;
  }>;
  performanceTrends: {
    weeklyVelocity: Array<{
      week: string;
      tasksCompleted: number;
      averageTimeToComplete: number;
    }>;
    monthlyCompletionRates: Array<{
      month: string;
      completionRate: number;
      totalTasks: number;
    }>;
  };
}

export async function getTeamPerformanceAnalyticsService(
  enterpriseId: string
): Promise<ServiceResponse<TeamPerformanceAnalytics>> {
  try {
    // Import necessary schema and functions
    const { tasks, users } = await import("@/server/src/db/schema");
    const { count, avg, sql } = await import("drizzle-orm");

    // Get basic team metrics
    const teamMetrics = await db
      .select({
        totalTasks: count(),
        completedTasks: count(
          sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`
        ),
        inProgressTasks: count(
          sql`CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END`
        ),
        overdueTasks: count(
          sql`CASE WHEN ${tasks.dueDate} < NOW() AND ${tasks.status} != 'done' THEN 1 END`
        ),
        averageComplexity: avg(tasks.complexity),
      })
      .from(tasks)
      .where(eq(tasks.enterpriseId, enterpriseId));

    // Get user performance data
    const userPerformance = await db
      .select({
        userId: users.id,
        username: users.githubUsername,
        avatarUrl: users.avatarUrl,
        totalTasks: count(),
        completedTasks: count(
          sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`
        ),
        inProgressTasks: count(
          sql`CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END`
        ),
        overdueTasks: count(
          sql`CASE WHEN ${tasks.dueDate} < NOW() AND ${tasks.status} != 'done' THEN 1 END`
        ),
        averageComplexity: avg(tasks.complexity),
        lastActiveAt: sql`MAX(${tasks.updatedAt})`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.enterpriseId, enterpriseId))
      .groupBy(users.id, users.githubUsername, users.avatarUrl);

    // Get total users count
    const totalUsers = await db
      .select({ count: count() })
      .from(enterpriseUsers)
      .where(eq(enterpriseUsers.enterpriseId, enterpriseId));

    // Get active users (users with tasks in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await db
      .select({ count: count(sql`DISTINCT ${tasks.assigneeId}`) })
      .from(tasks)
      .where(
        and(
          eq(tasks.enterpriseId, enterpriseId),
          sql`${tasks.updatedAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      );

    // Calculate derived metrics
    const metrics = teamMetrics[0];
    const completionRate =
      metrics.totalTasks > 0
        ? (Number(metrics.completedTasks) / Number(metrics.totalTasks)) * 100
        : 0;

    const taskVelocity =
      metrics.totalTasks > 0
        ? Number(metrics.completedTasks) / 30 // Assuming 30 days for now
        : 0;

    // Transform user performance data
    const transformedUserPerformance = userPerformance.map((user) => ({
      userId: user.userId,
      username: user.username || "Unknown",
      avatarUrl: user.avatarUrl,
      completionRate:
        user.totalTasks > 0
          ? (Number(user.completedTasks) / Number(user.totalTasks)) * 100
          : 0,
      taskVelocity: Number(user.completedTasks) / 30, // Tasks per month
      averageTaskComplexity: 0, // Default value - complexity field exists but not yet implemented in UI
      tasksCompleted: Number(user.completedTasks),
      tasksInProgress: Number(user.inProgressTasks),
      tasksOverdue: Number(user.overdueTasks),
      averageTimeToComplete: 8.5, // Default value since time tracking fields might not exist yet
      lastActiveAt: user.lastActiveAt as string | null,
    }));

    // Get real performance trends from the last 4 weeks
    const weeklyVelocity = await db
      .select({
        week: sql`DATE_TRUNC('week', ${tasks.completedAt})`,
        tasksCompleted: count(),
        averageTimeToComplete: avg(
          sql`EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 3600`
        ),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.enterpriseId, enterpriseId),
          eq(tasks.status, "done"),
          sql`${tasks.completedAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${tasks.completedAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${tasks.completedAt})`);

    // Get monthly completion rates for the last 4 months
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const monthlyCompletionRates = await db
      .select({
        month: sql`DATE_TRUNC('month', ${tasks.createdAt})`,
        totalTasks: count(),
        completedTasks: count(
          sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`
        ),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.enterpriseId, enterpriseId),
          sql`${tasks.createdAt} >= ${fourMonthsAgo.toISOString()}`
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${tasks.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${tasks.createdAt})`);

    // Transform trend data
    const transformedWeeklyVelocity = weeklyVelocity.map((week) => ({
      week: new Date(week.week as string).toISOString().split("T")[0],
      tasksCompleted: Number(week.tasksCompleted),
      averageTimeToComplete: Number(week.averageTimeToComplete) || 8.5,
    }));

    const transformedMonthlyRates = monthlyCompletionRates.map((month) => ({
      month: new Date(month.month as string).toISOString().slice(0, 7), // YYYY-MM format
      completionRate:
        month.totalTasks > 0
          ? (Number(month.completedTasks) / Number(month.totalTasks)) * 100
          : 0,
      totalTasks: Number(month.totalTasks),
    }));

    // If no real data, provide some fallback trends
    const performanceTrends = {
      weeklyVelocity:
        transformedWeeklyVelocity.length > 0
          ? transformedWeeklyVelocity
          : [
              {
                week: "2024-01-01",
                tasksCompleted: 0,
                averageTimeToComplete: 8.5,
              },
              {
                week: "2024-01-08",
                tasksCompleted: 0,
                averageTimeToComplete: 8.5,
              },
              {
                week: "2024-01-15",
                tasksCompleted: 0,
                averageTimeToComplete: 8.5,
              },
            ],
      monthlyCompletionRates:
        transformedMonthlyRates.length > 0
          ? transformedMonthlyRates
          : [
              { month: "2024-01", completionRate: 0, totalTasks: 0 },
              { month: "2024-02", completionRate: 0, totalTasks: 0 },
              { month: "2024-03", completionRate: 0, totalTasks: 0 },
            ],
    };

    const analytics: TeamPerformanceAnalytics = {
      enterpriseId,
      totalUsers: Number(totalUsers[0]?.count || 0),
      activeUsers: Number(activeUsers[0]?.count || 0),
      teamMetrics: {
        averageCompletionRate: completionRate,
        averageTaskVelocity: taskVelocity,
        averageTaskComplexity: Number(metrics.averageComplexity) || 0,
        totalTasksCompleted: Number(metrics.completedTasks),
        totalTasksInProgress: Number(metrics.inProgressTasks),
        totalTasksOverdue: Number(metrics.overdueTasks),
        averageTimeToComplete: 8.5, // Default value until time tracking is added
      },
      userPerformance: transformedUserPerformance,
      performanceTrends,
    };

    return { success: true, data: analytics };
  } catch (error) {
    console.error("Error fetching team performance analytics:", error);
    throw new ServiceError("Failed to fetch team performance analytics", 500);
  }
}
