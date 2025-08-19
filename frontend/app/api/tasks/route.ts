import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import {
  tasks,
  users,
  enterpriseUsers,
  projectMembers,
  projects,
} from "@/server/src/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";
import { analyzeTaskInBackground } from "@/server/src/services/task-analysis.service";

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

    // Get enterpriseId and projectId from query params
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");
    const projectId = searchParams.get("projectId");

    // Build where clause
    let whereClause;

    // If projectId is provided, show all tasks in that project for users with access
    if (projectId) {
      // First check if user has access to this project
      const projectAccess = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, dbUser.id)
          )
        )
        .limit(1);

      // Also check if user is admin of the enterprise that owns this project
      const project = await db
        .select({ enterpriseId: projects.enterpriseId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      let hasAccess = false;
      if (project.length > 0) {
        const enterpriseAdminCheck = await db
          .select()
          .from(enterpriseUsers)
          .where(
            and(
              eq(enterpriseUsers.enterpriseId, project[0].enterpriseId),
              eq(enterpriseUsers.userId, dbUser.id),
              eq(enterpriseUsers.role, "admin")
            )
          )
          .limit(1);

        hasAccess = projectAccess.length > 0 || enterpriseAdminCheck.length > 0;
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to this project" },
          { status: 403 }
        );
      }

      // Show all tasks in the project
      whereClause = eq(tasks.projectId, projectId);
    } else {
      // Fallback to showing only user's tasks when no project is specified
      whereClause = or(
        eq(tasks.createdById, dbUser.id),
        eq(tasks.assigneeId, dbUser.id)
      );
    }

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
        estimatedHours: tasks.estimatedHours,
        complexity: tasks.complexity,
        taskType: tasks.taskType,
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
      projectId,
      estimatedHours,
      complexity,
      taskType,
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
        projectId: projectId || null,
        assignedAt: assignedAt,
        // Don't set these fields - they'll be filled by AI analysis
        estimatedHours: null,
        complexity: null, // Let AI analysis determine complexity
        taskType: null,
      })
      .returning();

    // Start background AI analysis
    analyzeTaskInBackground(newTask[0].id).catch((error) => {
      console.error("Background task analysis failed:", error);
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
