import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import { tasks, enterpriseUsers } from "@/server/src/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get the task with its dependencies and blockers
    const taskData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dependencies: tasks.dependencies,
        blockers: tasks.blockers,
        enterpriseId: tasks.enterpriseId,
      })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (taskData.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = taskData[0];

    // Check if user has access to the task's enterprise
    if (task.enterpriseId) {
      const userEnterprise = await db
        .select()
        .from(enterpriseUsers)
        .where(
          and(
            eq(enterpriseUsers.enterpriseId, task.enterpriseId),
            eq(enterpriseUsers.userId, dbUser.id)
          )
        )
        .limit(1);

      if (userEnterprise.length === 0) {
        return NextResponse.json(
          { error: "You don't have access to this task" },
          { status: 403 }
        );
      }
    }

    // Get dependency and blocker task details
    const dependencyIds = task.dependencies || [];
    const blockerIds = task.blockers || [];

    const [dependencyTasks, blockerTasks] = await Promise.all([
      dependencyIds.length > 0
        ? db
            .select({
              id: tasks.id,
              title: tasks.title,
              status: tasks.status,
              priority: tasks.priority,
            })
            .from(tasks)
            .where(inArray(tasks.id, dependencyIds))
        : [],
      blockerIds.length > 0
        ? db
            .select({
              id: tasks.id,
              title: tasks.title,
              status: tasks.status,
              priority: tasks.priority,
            })
            .from(tasks)
            .where(inArray(tasks.id, blockerIds))
        : [],
    ]);

    return NextResponse.json({
      dependencies: dependencyTasks,
      blockers: blockerTasks,
    });
  } catch (error) {
    console.error("Error fetching task dependencies:", error);
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
    const { id } = await params;

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
    const { type, taskIds } = body; // type: 'dependencies' or 'blockers'

    if (!type || !taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "Type and taskIds array are required" },
        { status: 400 }
      );
    }

    // Get the current task
    const taskData = await db
      .select({
        id: tasks.id,
        dependencies: tasks.dependencies,
        blockers: tasks.blockers,
        enterpriseId: tasks.enterpriseId,
      })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (taskData.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = taskData[0];

    // Check if user has access to the task's enterprise
    if (task.enterpriseId) {
      const userEnterprise = await db
        .select()
        .from(enterpriseUsers)
        .where(
          and(
            eq(enterpriseUsers.enterpriseId, task.enterpriseId),
            eq(enterpriseUsers.userId, dbUser.id)
          )
        )
        .limit(1);

      if (userEnterprise.length === 0) {
        return NextResponse.json(
          { error: "You don't have access to this task" },
          { status: 403 }
        );
      }
    }

    // Validate that all taskIds exist and belong to the same enterprise
    if (taskIds.length > 0) {
      const targetTasks = await db
        .select({
          id: tasks.id,
          enterpriseId: tasks.enterpriseId,
        })
        .from(tasks)
        .where(inArray(tasks.id, taskIds));

      if (targetTasks.length !== taskIds.length) {
        return NextResponse.json(
          { error: "One or more tasks not found" },
          { status: 404 }
        );
      }

      // Check if all tasks belong to the same enterprise
      const differentEnterprise = targetTasks.some(
        (t) => t.enterpriseId !== task.enterpriseId
      );
      if (differentEnterprise) {
        return NextResponse.json(
          { error: "All tasks must belong to the same enterprise" },
          { status: 400 }
        );
      }
    }

    // Update the task with new dependencies or blockers
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (type === "dependencies") {
      updateData.dependencies = taskIds;
    } else if (type === "blockers") {
      updateData.blockers = taskIds;
    } else {
      return NextResponse.json(
        { error: "Type must be 'dependencies' or 'blockers'" },
        { status: 400 }
      );
    }

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json({ task: updatedTask[0] });
  } catch (error) {
    console.error("Error updating task dependencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
