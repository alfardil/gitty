import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import {
  tasks,
  users,
  taskAssignments,
  enterpriseUsers,
} from "@/server/src/db/schema";
import { eq, or, and } from "drizzle-orm";
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

    // Get enterpriseId from query params
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");

    // Build where clause
    let whereClause = or(
      eq(tasks.createdById, dbUser.id),
      eq(tasks.assigneeId, dbUser.id)
    );

    // Add enterprise filter if provided
    if (enterpriseId) {
      whereClause = and(whereClause, eq(tasks.enterpriseId, enterpriseId));
    }

    const userTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeId: tasks.assigneeId,
        enterpriseId: tasks.enterpriseId,
        completedAt: tasks.completedAt,
        tags: tasks.tags,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: users.firstName,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(whereClause)
      .orderBy(tasks.status, tasks.position);

    return NextResponse.json({ tasks: userTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      priority,
      dueDate,
      tags,
      assigneeId,
      enterpriseId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get the highest position for the given status
    const maxPositionResult = await db
      .select({ maxPosition: tasks.position })
      .from(tasks)
      .where(eq(tasks.status, "not_started"))
      .orderBy(tasks.position)
      .limit(1);

    const newPosition =
      maxPositionResult.length > 0
        ? (
            parseFloat(maxPositionResult[0].maxPosition.toString()) + 1000
          ).toString()
        : "1000";

    // Default assignee to creator if not specified
    const finalAssigneeId = assigneeId || dbUser.id;
    const assignedAt = new Date().toISOString();

    // Get user's enterprise if not specified
    let finalEnterpriseId = enterpriseId;
    if (!finalEnterpriseId) {
      const userEnterprise = await db
        .select({ enterpriseId: enterpriseUsers.enterpriseId })
        .from(enterpriseUsers)
        .where(eq(enterpriseUsers.userId, dbUser.id))
        .limit(1);

      if (userEnterprise.length > 0) {
        finalEnterpriseId = userEnterprise[0].enterpriseId;
      }
    }

    const newTask = await db
      .insert(tasks)
      .values({
        title,
        description,
        priority: priority || "medium",
        dueDate: dueDate ? dueDate : null,
        tags: tags || [],
        position: newPosition,
        createdById: dbUser.id,
        assigneeId: finalAssigneeId,
        enterpriseId: finalEnterpriseId || null,
        assignedAt: assignedAt,
      })
      .returning();

    // Create assignment history record (always create since task is always assigned)
    await db.insert(taskAssignments).values({
      taskId: newTask[0].id,
      assigneeId: finalAssigneeId,
      assignedById: dbUser.id,
      assignedAt: assignedAt,
    });

    return NextResponse.json({ task: newTask[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
