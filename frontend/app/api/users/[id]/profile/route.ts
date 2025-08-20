import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/src/db";
import {
  users,
  tasks,
  enterpriseUsers,
  enterprises,
} from "@/server/src/db/schema";
import { eq, and, isNull, isNotNull, count, sql, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetUserId
      );
    if (!isUUID) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    const currentUserGithubId = String(currentUser.id);

    const currentDbUser = await getUserByGithubId(currentUserGithubId);
    if (!currentDbUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const currentUserId = currentDbUser.id;

    const adminEnterprises = await db
      .select({
        enterpriseId: enterpriseUsers.enterpriseId,
        enterpriseName: enterprises.name,
      })
      .from(enterpriseUsers)
      .innerJoin(enterprises, eq(enterpriseUsers.enterpriseId, enterprises.id))
      .where(
        and(
          eq(enterpriseUsers.userId, currentUserId),
          eq(enterpriseUsers.role, "admin")
        )
      );

    if (!adminEnterprises.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminEnterpriseIds = adminEnterprises.map((ent) => ent.enterpriseId);

    let filteredEnterpriseIds = adminEnterpriseIds;
    if (enterpriseId) {
      if (!adminEnterpriseIds.includes(enterpriseId)) {
        return NextResponse.json(
          { error: "You don't have admin access to this enterprise" },
          { status: 403 }
        );
      }
      filteredEnterpriseIds = [enterpriseId];
    }

    const targetUserEnterprises = await db
      .select()
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.userId, targetUserId),
          inArray(enterpriseUsers.enterpriseId, filteredEnterpriseIds)
        )
      );

    if (!targetUserEnterprises.length) {
      return NextResponse.json(
        { error: "User not found in your enterprises" },
        { status: 404 }
      );
    }

    const userDetails = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!userDetails.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userDetails[0];

    const taskStats = await db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`),
        inProgress: count(
          sql`CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END`
        ),
        notStarted: count(
          sql`CASE WHEN ${tasks.status} = 'not_started' THEN 1 END`
        ),
        pendingApproval: count(
          sql`CASE WHEN ${tasks.status} = 'pending_pr_approval' THEN 1 END`
        ),
        assigned: count(
          sql`CASE WHEN ${tasks.assigneeId} = ${targetUserId} THEN 1 END`
        ),
        created: count(
          sql`CASE WHEN ${tasks.createdById} = ${targetUserId} THEN 1 END`
        ),
        highPriority: count(
          sql`CASE WHEN ${tasks.priority} = 'high' AND ${tasks.assigneeId} = ${targetUserId} THEN 1 END`
        ),
        mediumPriority: count(
          sql`CASE WHEN ${tasks.priority} = 'medium' AND ${tasks.assigneeId} = ${targetUserId} THEN 1 END`
        ),
        lowPriority: count(
          sql`CASE WHEN ${tasks.priority} = 'low' AND ${tasks.assigneeId} = ${targetUserId} THEN 1 END`
        ),
        overdue: count(
          sql`CASE WHEN ${tasks.dueDate} < NOW() AND ${tasks.status} != 'done' AND ${tasks.assigneeId} = ${targetUserId} THEN 1 END`
        ),
      })
      .from(tasks)
      .where(
        and(
          inArray(tasks.enterpriseId, filteredEnterpriseIds),
          sql`(${tasks.assigneeId} = ${targetUserId} OR ${tasks.createdById} = ${targetUserId})`
        )
      );

    // Get completion rate over time (last 30 days) - filtered by enterprise
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completionHistory = await db
      .select({
        date: sql`DATE(${tasks.completedAt})`,
        count: count(),
      })
      .from(tasks)
      .where(
        and(
          inArray(tasks.enterpriseId, filteredEnterpriseIds),
          eq(tasks.assigneeId, targetUserId),
          eq(tasks.status, "done"),
          sql`${tasks.completedAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      )
      .groupBy(sql`DATE(${tasks.completedAt})`)
      .orderBy(sql`DATE(${tasks.completedAt})`);

    // Calculate completion rate - based on assigned tasks only
    const stats = taskStats[0];
    const completionRate =
      stats.assigned > 0 ? (stats.completed / stats.assigned) * 100 : 0;

    // Calculate average completion time (for completed tasks) - filtered by enterprise
    const avgCompletionTime = await db
      .select({
        avgDays: sql`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 86400)`,
      })
      .from(tasks)
      .where(
        and(
          inArray(tasks.enterpriseId, filteredEnterpriseIds),
          eq(tasks.assigneeId, targetUserId),
          eq(tasks.status, "done"),
          isNotNull(tasks.completedAt)
        )
      );

    // Get the enterprise name for display
    const enterpriseName = enterpriseId
      ? adminEnterprises.find((e) => e.enterpriseId === enterpriseId)
          ?.enterpriseName
      : null;

    const profileData = {
      user: {
        id: user.id,
        githubUsername: user.githubUsername,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        linkedin: user.linkedin,
        role: user.role,
        joinedAt: user.joinedAt,
        subscriptionPlan: user.subscriptionPlan,
      },
      statistics: {
        totalTasks: Number(stats.assigned), // Show assigned tasks as total for consistency
        completedTasks: Number(stats.completed),
        inProgressTasks: Number(stats.inProgress),
        notStartedTasks: Number(stats.notStarted),
        pendingApprovalTasks: Number(stats.pendingApproval),
        assignedTasks: Number(stats.assigned),
        createdTasks: Number(stats.created),
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime: avgCompletionTime[0]?.avgDays
          ? Math.round(Number(avgCompletionTime[0].avgDays) * 100) / 100
          : null,
        priorityBreakdown: {
          high: Number(stats.highPriority),
          medium: Number(stats.mediumPriority),
          low: Number(stats.lowPriority),
        },
        overdueTasks: Number(stats.overdue),
      },
      completionHistory,
      enterprises: adminEnterprises,
      // Add enterprise context for filtered view
      enterpriseContext: enterpriseId
        ? {
            enterpriseId,
            enterpriseName,
            isFiltered: true,
          }
        : null,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { linkedin, role, email } = body;

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetUserId
      );
    if (!isUUID) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    const currentUserGithubId = String(currentUser.id);

    const currentDbUser = await getUserByGithubId(currentUserGithubId);
    if (!currentDbUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Check if user is updating their own profile or is an admin
    const isOwnProfile = currentDbUser.id === targetUserId;

    if (!isOwnProfile) {
      // Check if current user is admin of any enterprise that includes the target user
      const adminEnterprises = await db
        .select({
          enterpriseId: enterpriseUsers.enterpriseId,
        })
        .from(enterpriseUsers)
        .where(
          and(
            eq(enterpriseUsers.userId, currentDbUser.id),
            eq(enterpriseUsers.role, "admin")
          )
        );

      if (!adminEnterprises.length) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const adminEnterpriseIds = adminEnterprises.map(
        (ent) => ent.enterpriseId
      );

      const targetUserEnterprises = await db
        .select()
        .from(enterpriseUsers)
        .where(
          and(
            eq(enterpriseUsers.userId, targetUserId),
            inArray(enterpriseUsers.enterpriseId, adminEnterpriseIds)
          )
        );

      if (!targetUserEnterprises.length) {
        return NextResponse.json(
          { error: "User not found in your enterprises" },
          { status: 404 }
        );
      }
    }

    // Update the user profile
    const updateData: any = {};
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) {
      // Check if email is already taken by another user
      if (email && email !== currentDbUser.email) {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return NextResponse.json(
            { error: "Email address is already in use" },
            { status: 400 }
          );
        }
      }
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    console.log("Updating user profile:", {
      userId: targetUserId,
      updateData,
      linkedin,
      role,
    });

    try {
      await db.update(users).set(updateData).where(eq(users.id, targetUserId));
      console.log("Database update successful");
    } catch (dbError) {
      console.error("Database update failed:", dbError);
      return NextResponse.json(
        {
          error: "Database update failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
