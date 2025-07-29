import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/src/db";
import {
  users,
  tasks,
  taskAssignments,
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const enterpriseId = searchParams.get("enterpriseId");
    const offset = (page - 1) * limit;

    // Validate that targetUserId is a UUID
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

    // Get current user's UUID from their GitHub ID
    const currentDbUser = await getUserByGithubId(currentUserGithubId);
    if (!currentDbUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const currentUserId = currentDbUser.id;

    // Check if current user is admin of any enterprise that the target user belongs to
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

    // If enterpriseId is provided, validate that the current user is admin of that enterprise
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

    // Check if target user belongs to any of the admin's enterprises
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

    // Get total count for pagination - filtered by enterprise
    const totalCount = await db
      .select({ count: count() })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .where(
        and(
          eq(taskAssignments.assigneeId, targetUserId),
          inArray(tasks.enterpriseId, filteredEnterpriseIds)
        )
      );

    // Get assignment history with pagination - filtered by enterprise
    const assignmentHistory = await db
      .select({
        id: taskAssignments.id,
        taskId: taskAssignments.taskId,
        assignedAt: taskAssignments.assignedAt,
        unassignedAt: taskAssignments.unassignedAt,
        assignedBy: sql`${taskAssignments.assignedById}`,
        taskTitle: tasks.title,
      })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .where(
        and(
          eq(taskAssignments.assigneeId, targetUserId),
          inArray(tasks.enterpriseId, filteredEnterpriseIds)
        )
      )
      .orderBy(sql`${taskAssignments.assignedAt} DESC`)
      .limit(limit)
      .offset(offset);

    const total = Number(totalCount[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      assignments: assignmentHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
