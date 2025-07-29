import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import {
  tasks,
  users,
  enterpriseUsers,
  projectMembers,
} from "@/server/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = null;
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    const dbUser = await getUserByGithubId(String(user.id));
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const enterpriseId = searchParams.get("enterpriseId");
    const projectId = searchParams.get("projectId");

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "getAdminEnterprises":
        const adminEnterprises = await db
          .select({
            id: enterpriseUsers.enterpriseId,
            name: sql<string>`enterprises.name`,
            role: enterpriseUsers.role,
          })
          .from(enterpriseUsers)
          .innerJoin(
            sql`enterprises`,
            sql`enterprises.id = ${enterpriseUsers.enterpriseId}`
          )
          .where(
            and(
              eq(enterpriseUsers.userId, dbUser.id),
              eq(enterpriseUsers.role, "admin")
            )
          );

        return NextResponse.json({
          success: true,
          data: { enterprises: adminEnterprises },
        });

      case "getEnterpriseUsers":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const userEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (userEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        // Get all users in the enterprise
        const enterpriseUsersQuery = db
          .select({
            id: users.id,
            githubId: users.githubId,
            githubUsername: users.githubUsername,
            avatarUrl: users.avatarUrl,
            firstName: users.firstName,
            lastName: users.lastName,
            subscription_plan: users.subscriptionPlan,
            role: enterpriseUsers.role,
          })
          .from(users)
          .innerJoin(
            enterpriseUsers,
            and(
              eq(users.id, enterpriseUsers.userId),
              eq(enterpriseUsers.enterpriseId, enterpriseId)
            )
          );

        // If projectId is provided, filter to only show users assigned to that project
        const enterpriseUsersData = projectId
          ? await enterpriseUsersQuery
              .where(
                sql`${users.id} IN (
                  SELECT user_id FROM project_members WHERE project_id = ${projectId}
                )`
              )
              .orderBy(users.firstName, users.lastName)
          : await enterpriseUsersQuery.orderBy(users.firstName, users.lastName);

        return NextResponse.json({
          success: true,
          data: { users: enterpriseUsersData },
        });

      case "getTeamPerformanceAnalytics":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const analyticsUserEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (analyticsUserEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        let taskWhereClause = eq(tasks.enterpriseId, enterpriseId);
        if (projectId) {
          taskWhereClause = and(
            taskWhereClause,
            eq(tasks.projectId, projectId)
          )!;
        }

        const allTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            assigneeId: tasks.assigneeId,
            estimatedHours: tasks.estimatedHours,
            actualHours: tasks.actualHours,
            complexity: tasks.complexity,
            createdAt: tasks.createdAt,
            completedAt: tasks.completedAt,
          })
          .from(tasks)
          .where(taskWhereClause);

        const allUsers = await db
          .select({
            id: users.id,
            githubUsername: users.githubUsername,
            avatarUrl: users.avatarUrl,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .innerJoin(
            enterpriseUsers,
            and(
              eq(users.id, enterpriseUsers.userId),
              eq(enterpriseUsers.enterpriseId, enterpriseId)
            )
          );

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(
          (task) => task.status === "done"
        ).length;
        const inProgressTasks = allTasks.filter(
          (task) => task.status === "in_progress"
        ).length;

        const averageCompletionRate =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const averageTaskVelocity = totalTasks > 0 ? totalTasks / 12 : 0;
        const averageTaskComplexity =
          allTasks.length > 0
            ? allTasks.reduce((sum, task) => sum + (task.complexity || 3), 0) /
              allTasks.length
            : 3;

        const userPerformance = allUsers.map((user) => {
          const userTasks = allTasks.filter(
            (task) => task.assigneeId === user.id
          );
          const userCompletedTasks = userTasks.filter(
            (task) => task.status === "done"
          ).length;
          const userInProgressTasks = userTasks.filter(
            (task) => task.status === "in_progress"
          ).length;

          const userCompletionRate =
            userTasks.length > 0
              ? (userCompletedTasks / userTasks.length) * 100
              : 0;
          const userTaskVelocity =
            userTasks.length > 0 ? userTasks.length / 12 : 0;
          const userAverageComplexity =
            userTasks.length > 0
              ? userTasks.reduce(
                  (sum, task) => sum + (task.complexity || 3),
                  0
                ) / userTasks.length
              : 3;

          return {
            userId: user.id,
            username:
              user.githubUsername || `${user.firstName} ${user.lastName}`,
            avatarUrl: user.avatarUrl,
            completionRate: userCompletionRate,
            taskVelocity: userTaskVelocity,
            averageTaskComplexity: userAverageComplexity,
            tasksCompleted: userCompletedTasks,
            tasksInProgress: userInProgressTasks,
            tasksOverdue: 0,
            averageTimeToComplete: 0,
            lastActiveAt: null,
          };
        });

        const teamMetrics = {
          averageCompletionRate,
          averageTaskVelocity,
          averageTaskComplexity,
          totalTasksCompleted: completedTasks,
          totalTasksInProgress: inProgressTasks,
          totalTasksOverdue: 0,
          averageTimeToComplete: 0,
        };

        const performanceTrends = {
          weeklyVelocity: [],
          monthlyCompletionRates: [],
        };

        return NextResponse.json({
          success: true,
          data: {
            enterpriseId,
            totalUsers: allUsers.length,
            activeUsers: allUsers.length,
            teamMetrics,
            userPerformance,
            performanceTrends,
          },
        });

      case "getQualityMetrics":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const qualityUserEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (qualityUserEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        let qualityTaskWhereClause = eq(tasks.enterpriseId, enterpriseId);
        if (projectId) {
          qualityTaskWhereClause = and(
            qualityTaskWhereClause,
            eq(tasks.projectId, projectId)
          )!;
        }

        const qualityTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            reworkCount: tasks.reworkCount,
            approvalCount: tasks.approvalCount,
            scopeChanges: tasks.scopeChanges,
          })
          .from(tasks)
          .where(qualityTaskWhereClause);

        const totalReworkCount = qualityTasks.reduce(
          (sum, task) => sum + (task.reworkCount || 0),
          0
        );
        const totalApprovalCount = qualityTasks.reduce(
          (sum, task) => sum + (task.approvalCount || 0),
          0
        );
        const totalScopeChanges = qualityTasks.reduce(
          (sum, task) => sum + (task.scopeChanges || 0),
          0
        );

        let overallQualityScore = 100;
        overallQualityScore -= totalReworkCount * 15;
        overallQualityScore -= totalScopeChanges * 10;
        overallQualityScore += totalApprovalCount * 5;
        overallQualityScore = Math.max(
          0,
          Math.min(100, Math.round(overallQualityScore))
        );

        const taskMetrics = qualityTasks.map((task) => {
          let qualityScore = 100;
          qualityScore -= (task.reworkCount || 0) * 15;
          qualityScore -= (task.scopeChanges || 0) * 10;
          qualityScore += (task.approvalCount || 0) * 5;
          qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

          return {
            id: task.id,
            title: task.title,
            reworkCount: task.reworkCount || 0,
            approvalCount: task.approvalCount || 0,
            scopeChanges: task.scopeChanges || 0,
            qualityScore,
            status: task.status,
            priority: task.priority,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            overall: {
              reworkCount: totalReworkCount,
              approvalCount: totalApprovalCount,
              scopeChanges: totalScopeChanges,
              qualityScore: overallQualityScore,
            },
            tasks: taskMetrics,
          },
        });

      case "getTimeTrackingData":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const timeUserEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (timeUserEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        let timeTaskWhereClause = eq(tasks.enterpriseId, enterpriseId);
        if (projectId) {
          timeTaskWhereClause = and(
            timeTaskWhereClause,
            eq(tasks.projectId, projectId)
          )!;
        }

        const timeTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            assigneeId: tasks.assigneeId,
            estimatedHours: tasks.estimatedHours,
            actualHours: tasks.actualHours,
            startedAt: tasks.startedAt,
            completedAt: tasks.completedAt,
            createdAt: tasks.createdAt,
          })
          .from(tasks)
          .where(timeTaskWhereClause);

        const assigneeIds = [
          ...new Set(timeTasks.map((task) => task.assigneeId).filter(Boolean)),
        ];
        const assignees =
          assigneeIds.length > 0
            ? await db
                .select({
                  id: users.id,
                  firstName: users.firstName,
                  lastName: users.lastName,
                  githubUsername: users.githubUsername,
                })
                .from(users)
                .where(sql`${users.id} IN (${assigneeIds.join(",")})`)
            : [];

        const totalEstimatedHours = timeTasks.reduce(
          (sum, task) => sum + (parseFloat(task.estimatedHours || "0") || 0),
          0
        );
        const totalActualHours = timeTasks.reduce(
          (sum, task) => sum + (parseFloat(task.actualHours || "0") || 0),
          0
        );
        const tasksWithTimeTracking = timeTasks.filter(
          (task) => task.actualHours !== null && task.actualHours !== undefined
        ).length;
        const averageTimePerTask =
          tasksWithTimeTracking > 0
            ? totalActualHours / tasksWithTimeTracking
            : 0;

        const accuracyScores = timeTasks
          .filter((task) => task.estimatedHours && task.actualHours)
          .map((task) => {
            const estimated = parseFloat(task.estimatedHours || "0");
            const actual = parseFloat(task.actualHours || "0");
            if (estimated === 0) return 0;
            return Math.max(
              0,
              100 - Math.abs((actual - estimated) / estimated) * 100
            );
          });

        const averageEstimationAccuracy =
          accuracyScores.length > 0
            ? accuracyScores.reduce((sum, score) => sum + score, 0) /
              accuracyScores.length
            : 0;

        const estimationTrend =
          averageEstimationAccuracy >= 80
            ? "improving"
            : averageEstimationAccuracy >= 60
              ? "stable"
              : "declining";

        const timeEntries = timeTasks.map((task) => {
          const assignee = assignees.find((a) => a.id === task.assigneeId);
          const estimated = parseFloat(task.estimatedHours || "0") || 0;
          const actual = parseFloat(task.actualHours || "0") || 0;
          const accuracy =
            estimated > 0
              ? Math.max(
                  0,
                  100 - Math.abs((actual - estimated) / estimated) * 100
                )
              : 0;

          return {
            id: task.id,
            taskId: task.id,
            taskTitle: task.title,
            estimatedHours: estimated,
            actualHours: actual,
            startedAt: task.startedAt || task.createdAt,
            completedAt: task.completedAt,
            estimationAccuracy: accuracy,
            status: task.status,
            assigneeName: assignee
              ? assignee.firstName && assignee.lastName
                ? `${assignee.firstName} ${assignee.lastName}`
                : assignee.githubUsername
              : "Unknown",
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            analytics: {
              totalEstimatedHours,
              totalActualHours,
              averageEstimationAccuracy,
              tasksWithTimeTracking,
              averageTimePerTask,
              estimationTrend,
            },
            entries: timeEntries,
          },
        });

      case "getDependencyData":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const depUserEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (depUserEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        let depTaskWhereClause = eq(tasks.enterpriseId, enterpriseId);
        if (projectId) {
          depTaskWhereClause = and(
            depTaskWhereClause,
            eq(tasks.projectId, projectId)
          )!;
        }

        const depTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            dependencies: tasks.dependencies,
            blockers: tasks.blockers,
          })
          .from(tasks)
          .where(depTaskWhereClause);

        const totalDependencies = depTasks.reduce(
          (sum, task) => sum + (task.dependencies?.length || 0),
          0
        );
        const totalBlockers = depTasks.reduce(
          (sum, task) => sum + (task.blockers?.length || 0),
          0
        );
        const circularDependencies = 0;
        const criticalPaths = depTasks.filter(
          (task) => task.dependencies?.length === 0
        ).length;

        const dependencyGraphs = depTasks.map((task) => {
          const dependencyIds = task.dependencies || [];
          const blockerIds = task.blockers || [];

          const dependencies = depTasks
            .filter((t) => dependencyIds.includes(t.id))
            .map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              type: "dependency" as const,
            }));

          const blockers = depTasks
            .filter((t) => blockerIds.includes(t.id))
            .map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              type: "blocker" as const,
            }));

          return {
            currentTask: {
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
            },
            dependencies,
            blockers,
            circularDependencies: [],
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            tasks: dependencyGraphs,
            summary: {
              totalDependencies,
              totalBlockers,
              circularDependencies,
              criticalPaths,
            },
          },
        });

      case "analyzeExistingTasks":
        if (!enterpriseId) {
          return NextResponse.json(
            { error: "Enterprise ID is required" },
            { status: 400 }
          );
        }

        const analyzeUserEnterprise = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id)
            )
          )
          .limit(1);

        if (analyzeUserEnterprise.length === 0) {
          return NextResponse.json(
            { error: "You don't have access to this enterprise" },
            { status: 403 }
          );
        }

        const tasksToAnalyze = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            priority: tasks.priority,
            dueDate: tasks.dueDate,
            tags: tasks.tags,
            estimatedHours: tasks.estimatedHours,
            complexity: tasks.complexity,
            taskType: tasks.taskType,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.enterpriseId, enterpriseId),
              sql`(${tasks.estimatedHours} IS NULL OR ${tasks.complexity} IS NULL OR ${tasks.taskType} IS NULL)`
            )
          );

        return NextResponse.json({
          success: true,
          message: `Started analysis for ${tasksToAnalyze.length} tasks`,
          data: { tasksToAnalyze: tasksToAnalyze.length },
        });

      case "getUserEnterprises":
        const targetUserId = searchParams.get("userId");
        if (!targetUserId) {
          return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
          );
        }

        // Get all enterprises where the user is a member (not just admin)
        const userEnterprises = await db
          .select({
            id: enterpriseUsers.enterpriseId,
            name: sql<string>`enterprises.name`,
            role: enterpriseUsers.role,
          })
          .from(enterpriseUsers)
          .innerJoin(
            sql`enterprises`,
            sql`enterprises.id = ${enterpriseUsers.enterpriseId}`
          )
          .where(eq(enterpriseUsers.userId, targetUserId));

        return NextResponse.json({
          success: true,
          data: { enterprises: userEnterprises },
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
