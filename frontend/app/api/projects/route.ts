import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/src/db";
import {
  projects,
  enterpriseUsers,
  projectMembers,
} from "@/server/src/db/schema";
import { eq, and } from "drizzle-orm";
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

    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Enterprise ID is required" },
        { status: 400 }
      );
    }

    // Check if user is member of the enterprise
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

    // Check if user is an admin of the enterprise
    const userEnterpriseRole = await db
      .select({ role: enterpriseUsers.role })
      .from(enterpriseUsers)
      .where(
        and(
          eq(enterpriseUsers.enterpriseId, enterpriseId),
          eq(enterpriseUsers.userId, dbUser.id)
        )
      )
      .limit(1);

    const isAdmin =
      userEnterpriseRole.length > 0 && userEnterpriseRole[0].role === "admin";

    // Get projects based on user role
    let enterpriseProjects;

    if (isAdmin) {
      // Admins can see all projects in the enterprise
      enterpriseProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          enterpriseId: projects.enterpriseId,
          createdById: projects.createdById,
          memberIds: projects.memberIds,
          status: projects.status,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          actualEndDate: projects.actualEndDate,
          estimatedTotalHours: projects.estimatedTotalHours,
          actualTotalHours: projects.actualTotalHours,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.enterpriseId, enterpriseId))
        .orderBy(projects.createdAt);
    } else {
      // Regular members can only see projects they're assigned to
      enterpriseProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          enterpriseId: projects.enterpriseId,
          createdById: projects.createdById,
          memberIds: projects.memberIds,
          status: projects.status,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          actualEndDate: projects.actualEndDate,
          estimatedTotalHours: projects.estimatedTotalHours,
          actualTotalHours: projects.actualTotalHours,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .innerJoin(
          projectMembers,
          and(
            eq(projects.id, projectMembers.projectId),
            eq(projectMembers.userId, dbUser.id)
          )
        )
        .where(eq(projects.enterpriseId, enterpriseId))
        .orderBy(projects.createdAt);
    }

    return NextResponse.json({ projects: enterpriseProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
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
      name,
      description,
      enterpriseId,
      startDate,
      targetEndDate,
      estimatedTotalHours,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Enterprise ID is required" },
        { status: 400 }
      );
    }

    // Check if user is member of the enterprise
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

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description,
        enterpriseId,
        createdById: dbUser.id,
        startDate: startDate || null,
        targetEndDate: targetEndDate || null,
        estimatedTotalHours: estimatedTotalHours || null,
      })
      .returning();

    return NextResponse.json({ project: newProject[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
