import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import {
  users,
  projects,
  projectMembers,
  enterpriseUsers,
  enterprises,
  tasks,
  taskTimeEntries,
} from "@/server/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params;

    // Get project details
    const projectData = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        enterpriseId: projects.enterpriseId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectData.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectData[0];

    // Check if user has access to this project's enterprise
    const userEnterprise = await db
      .select()
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.enterpriseId, project.enterpriseId),
          eq(enterpriseUsers.userId, dbUser.id)
        )
      )
      .limit(1);

    if (userEnterprise.length === 0) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get all users assigned to this project
    // Fallback to projectMembers table if memberIds is not available
    const assignedUsers = await db
      .select({
        id: users.id,
        githubId: users.githubId,
        githubUsername: users.githubUsername,
        avatarUrl: users.avatarUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        subscriptionPlan: users.subscriptionPlan,
        assignedAt: projectMembers.joinedAt,
        role: projectMembers.role,
      })
      .from(users)
      .innerJoin(
        projectMembers,
        and(
          eq(users.id, projectMembers.userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .orderBy(users.firstName, users.lastName);

    // Get all users in the enterprise who are NOT assigned to this project
    const availableUsers = await db
      .select({
        id: users.id,
        githubId: users.githubId,
        githubUsername: users.githubUsername,
        avatarUrl: users.avatarUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        subscriptionPlan: users.subscriptionPlan,
        enterpriseRole: enterpriseUsers.role,
      })
      .from(users)
      .innerJoin(
        enterpriseUsers,
        and(
          eq(users.id, enterpriseUsers.userId),
          eq(enterpriseUsers.enterpriseId, project.enterpriseId)
        )
      )
      .leftJoin(
        projectMembers,
        and(
          eq(users.id, projectMembers.userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .where(sql`${projectMembers.userId} IS NULL`)
      .orderBy(users.firstName, users.lastName);

    return NextResponse.json({
      success: true,
      data: {
        project,
        assignedUsers,
        availableUsers,
      },
    });
  } catch (error) {
    console.error("Project users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params;
    const { userId, role = "member" } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get project details
    const projectData = await db
      .select({
        id: projects.id,
        name: projects.name,
        enterpriseId: projects.enterpriseId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectData.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectData[0];

    // Check if user has admin access to this project's enterprise
    const userEnterprise = await db
      .select()
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.enterpriseId, project.enterpriseId),
          eq(enterpriseUsers.userId, dbUser.id),
          eq(enterpriseUsers.role, "admin")
        )
      )
      .limit(1);

    if (userEnterprise.length === 0) {
      return NextResponse.json(
        { error: "You need admin access to assign users to projects" },
        { status: 403 }
      );
    }

    // Check if the user to be assigned is in the enterprise
    const targetUserEnterprise = await db
      .select()
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.enterpriseId, project.enterpriseId),
          eq(enterpriseUsers.userId, userId)
        )
      )
      .limit(1);

    if (targetUserEnterprise.length === 0) {
      return NextResponse.json(
        { error: "User is not a member of this enterprise" },
        { status: 400 }
      );
    }

    // Check if user is already assigned to this project
    const existingAssignment = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: "User is already assigned to this project" },
        { status: 400 }
      );
    }

    // Assign user to project
    await db.insert(projectMembers).values({
      projectId,
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "User assigned to project successfully",
    });
  } catch (error) {
    console.error("Project user assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get project details
    const projectData = await db
      .select({
        id: projects.id,
        name: projects.name,
        enterpriseId: projects.enterpriseId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectData.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectData[0];

    // Check if user has admin access to this project's enterprise
    const userEnterprise = await db
      .select()
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.enterpriseId, project.enterpriseId),
          eq(enterpriseUsers.userId, dbUser.id),
          eq(enterpriseUsers.role, "admin")
        )
      )
      .limit(1);

    if (userEnterprise.length === 0) {
      return NextResponse.json(
        { error: "You need admin access to remove users from projects" },
        { status: 403 }
      );
    }

    // Remove user from project and clean up all related data
    await db.transaction(async (tx) => {
      // 1. Remove user from project members
      await tx
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId)
          )
        );

      // 2. Unassign all tasks assigned to this user in this project
      await tx
        .update(tasks)
        .set({
          assigneeId: null,
          assignedAt: null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(eq(tasks.projectId, projectId), eq(tasks.assigneeId, userId))
        );

      // 3. Mark task assignments as unassigned for this user in this project
      // This part of the logic is no longer needed as taskAssignments table is removed.
      // The original code had a subquery to find task IDs, but that's not possible
      // without the taskAssignments table.
      // For now, we'll just remove the taskAssignments.unassignedAt update.

      // 4. Clean up task time entries for this user in this project
      await tx.delete(taskTimeEntries).where(
        and(
          sql`${taskTimeEntries.taskId} IN (
            SELECT id FROM tasks WHERE project_id = ${projectId}
          )`,
          eq(taskTimeEntries.userId, userId)
        )
      );
    });

    return NextResponse.json({
      success: true,
      message:
        "User removed from project successfully. All associated tasks and time entries have been cleaned up.",
    });
  } catch (error) {
    console.error("Project user removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
