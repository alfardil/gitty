import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import { tasks, taskAssignments } from "@/server/src/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: any;
  let updateData: any;

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

    // Validate task ID format
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    body = await request.json();
    const {
      status,
      title,
      description,
      priority,
      dueDate,
      tags,
      position,
      assigneeId,
      projectId,
      estimatedHours,
      complexity,
      taskType,
    } = body;

    updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (status !== undefined && status !== null) {
      updateData.status = status;

      // If status is changing, update position to end of new status
      if (status !== body.currentStatus) {
        const maxPositionResult = await db
          .select({ maxPosition: tasks.position })
          .from(tasks)
          .where(eq(tasks.status, status))
          .orderBy(tasks.position)
          .limit(1);

        const newPosition =
          maxPositionResult.length > 0
            ? (
                parseFloat(maxPositionResult[0].maxPosition.toString()) + 1000
              ).toString()
            : "1000";

        updateData.position = newPosition;
      }
    }
    if (title !== undefined && title !== null) updateData.title = title;
    if (description !== undefined && description !== null)
      updateData.description = description;
    if (priority !== undefined && priority !== null)
      updateData.priority = priority;
    if (dueDate !== undefined) {
      // Handle empty string as null
      updateData.dueDate = dueDate === "" ? null : dueDate;
    }
    if (tags !== undefined && tags !== null) updateData.tags = tags;
    if (position !== undefined && position !== null)
      updateData.position = position;
    if (projectId !== undefined && projectId !== null)
      updateData.projectId = projectId;
    if (estimatedHours !== undefined && estimatedHours !== null)
      updateData.estimatedHours = estimatedHours;
    if (complexity !== undefined && complexity !== null)
      updateData.complexity = complexity;
    if (taskType !== undefined && taskType !== null)
      updateData.taskType = taskType;

    // Handle assignment tracking
    if (assigneeId !== undefined) {
      // Get current task to check if assignment is changing
      const currentTask = await db
        .select({ assigneeId: tasks.assigneeId })
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (currentTask.length > 0 && currentTask[0].assigneeId !== assigneeId) {
        // If assignment is changing, close any existing assignment and create new one
        if (currentTask[0].assigneeId) {
          // Close existing assignment
          await db
            .update(taskAssignments)
            .set({ unassignedAt: new Date().toISOString() })
            .where(
              and(
                eq(taskAssignments.taskId, id),
                eq(taskAssignments.assigneeId, currentTask[0].assigneeId),
                isNull(taskAssignments.unassignedAt)
              )
            );
        }

        if (assigneeId) {
          // Create new assignment record
          await db.insert(taskAssignments).values({
            taskId: id,
            assigneeId: assigneeId,
            assignedById: dbUser.id,
            assignedAt: new Date().toISOString(),
          });

          updateData.assignedAt = new Date().toISOString();
        }
      }

      updateData.assigneeId = assigneeId;
    }

    // Handle completion tracking
    if (status === "done" && body.currentStatus !== "done") {
      updateData.completedAt = new Date().toISOString();
    } else if (status !== "done" && body.currentStatus === "done") {
      // If task is being unmarked as done, clear completion time
      updateData.completedAt = null;
    }

    // Handle startedAt tracking when task moves to in_progress
    if (status === "in_progress" && body.currentStatus !== "in_progress") {
      updateData.startedAt = new Date().toISOString();
    }

    // Handle lastStatusChangeAt tracking
    if (status !== body.currentStatus) {
      updateData.lastStatusChangeAt = new Date().toISOString();
    }

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updatedTask[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    console.error("Request body:", body);
    console.error("Update data:", updateData);
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

    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
