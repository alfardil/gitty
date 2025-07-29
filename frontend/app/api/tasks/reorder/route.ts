import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import { tasks } from "@/server/src/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getUserByGithubId } from "@/server/src/db/actions";
import {
  calculateDragPosition,
  needsNormalization,
  normalizePositions,
  type PositionedTask,
} from "@/lib/utils/position";

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
    const { taskId, targetIndex, status } = body;

    if (!taskId || status === undefined || targetIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, get the dragged task to check its current status
    const draggedTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (draggedTask.length === 0) {
      return NextResponse.json(
        { error: "Dragged task not found" },
        { status: 404 }
      );
    }

    const currentTask = draggedTask[0];
    const isStatusChange = currentTask.status !== status;

    // If this is a status change, update the task status first
    if (isStatusChange) {
      const updateData: any = {
        status: status,
        updatedAt: new Date().toISOString(),
      };

      // Handle completion tracking
      if (status === "done" && currentTask.status !== "done") {
        updateData.completedAt = new Date().toISOString();
      } else if (status !== "done" && currentTask.status === "done") {
        // If task is being unmarked as done, clear completion time
        updateData.completedAt = null;
      }

      // Handle startedAt tracking when task moves to in_progress
      if (status === "in_progress" && currentTask.status !== "in_progress") {
        updateData.startedAt = new Date().toISOString();
      }

      // Handle lastStatusChangeAt tracking
      if (status !== currentTask.status) {
        updateData.lastStatusChangeAt = new Date().toISOString();
      }

      await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
    }

    // Get all tasks in the target status (including the moved task)
    const tasksInStatus = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(tasks.position);

    // Convert to PositionedTask format
    const positionedTasks: PositionedTask[] = tasksInStatus.map((t) => ({
      id: t.id,
      position: parseFloat(t.position.toString()),
      status: t.status,
    }));

    // Check if normalization is needed
    if (needsNormalization(positionedTasks)) {
      const normalizedTasks = normalizePositions(positionedTasks);

      // Update all tasks with normalized positions
      for (const task of normalizedTasks) {
        await db
          .update(tasks)
          .set({
            position: task.position.toString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tasks.id, task.id));
      }

      // Re-fetch tasks with normalized positions
      const normalizedTasksInStatus = await db
        .select()
        .from(tasks)
        .where(eq(tasks.status, status))
        .orderBy(tasks.position);

      const normalizedPositionedTasks: PositionedTask[] =
        normalizedTasksInStatus.map((t) => ({
          id: t.id,
          position: parseFloat(t.position.toString()),
          status: t.status,
        }));

      // Calculate new position for dragged task
      const newPosition = calculateDragPosition(
        normalizedPositionedTasks,
        taskId,
        targetIndex
      );

      // Update the dragged task position
      await db
        .update(tasks)
        .set({
          position: newPosition.toString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tasks.id, taskId));
    } else {
      // Calculate new position for dragged task
      const newPosition = calculateDragPosition(
        positionedTasks,
        taskId,
        targetIndex
      );

      // Update the dragged task position
      await db
        .update(tasks)
        .set({
          position: newPosition.toString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tasks.id, taskId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
