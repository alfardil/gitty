import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import { tasks, enterpriseUsers } from "@/server/src/db/schema";
import { eq, and } from "drizzle-orm";
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

    // Get the task with its quality metrics
    const taskData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        reworkCount: tasks.reworkCount,
        approvalCount: tasks.approvalCount,
        scopeChanges: tasks.scopeChanges,
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

    // Calculate quality score based on metrics
    const qualityScore = calculateQualityScore({
      reworkCount: task.reworkCount || 0,
      approvalCount: task.approvalCount || 0,
      scopeChanges: task.scopeChanges || 0,
    });

    return NextResponse.json({
      reworkCount: task.reworkCount || 0,
      approvalCount: task.approvalCount || 0,
      scopeChanges: task.scopeChanges || 0,
      qualityScore,
    });
  } catch (error) {
    console.error("Error fetching task metrics:", error);
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
    const { action, value } = body; // action: 'increment_rework', 'increment_approval', 'increment_scope', 'set_rework', 'set_approval', 'set_scope'

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Get the current task
    const taskData = await db
      .select({
        id: tasks.id,
        reworkCount: tasks.reworkCount,
        approvalCount: tasks.approvalCount,
        scopeChanges: tasks.scopeChanges,
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

    // Update the task with new metrics
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    switch (action) {
      case "increment_rework":
        updateData.reworkCount = (task.reworkCount || 0) + 1;
        break;
      case "increment_approval":
        updateData.approvalCount = (task.approvalCount || 0) + 1;
        break;
      case "increment_scope":
        updateData.scopeChanges = (task.scopeChanges || 0) + 1;
        break;
      case "set_rework":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json(
            { error: "Value must be a non-negative number" },
            { status: 400 }
          );
        }
        updateData.reworkCount = value;
        break;
      case "set_approval":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json(
            { error: "Value must be a non-negative number" },
            { status: 400 }
          );
        }
        updateData.approvalCount = value;
        break;
      case "set_scope":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json(
            { error: "Value must be a non-negative number" },
            { status: 400 }
          );
        }
        updateData.scopeChanges = value;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    // Calculate new quality score
    const newQualityScore = calculateQualityScore({
      reworkCount: updateData.reworkCount || task.reworkCount || 0,
      approvalCount: updateData.approvalCount || task.approvalCount || 0,
      scopeChanges: updateData.scopeChanges || task.scopeChanges || 0,
    });

    return NextResponse.json({
      task: updatedTask[0],
      qualityScore: newQualityScore,
    });
  } catch (error) {
    console.error("Error updating task metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate quality score (0-100)
function calculateQualityScore(task: {
  reworkCount?: number;
  approvalCount?: number;
  scopeChanges?: number;
}): number {
  const reworkCount = task.reworkCount || 0;
  const approvalCount = task.approvalCount || 0;
  const scopeChanges = task.scopeChanges || 0;

  // Base score starts at 100
  let score = 100;

  // Deduct points for quality issues
  score -= reworkCount * 15; // Each rework costs 15 points
  score -= scopeChanges * 10; // Each scope change costs 10 points

  // Bonus points for approvals (indicates good process)
  score += approvalCount * 5; // Each approval adds 5 points

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}
