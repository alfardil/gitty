import { NextRequest, NextResponse } from "next/server";
import {
  createEnterpriseService,
  generateMemberInviteCodeService,
  generateAdminInviteCodeService,
  redeemInviteCodeService,
  ServiceError,
  ServiceResponse,
} from "@/server/src/services/enterprise.service";
import { cookies } from "next/headers";
import {
  getUserByGithubId,
  migrateAllUsersToPersonalEnterprises,
} from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { enterpriseUsers, enterprises } from "@/server/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    // Handle migration action separately as it requires special auth
    if (action === "migrateUsersToPersonalEnterprises") {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("github_user");

      if (!userCookie) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      let user = null;
      try {
        user = JSON.parse(userCookie.value);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid user session" },
          { status: 401 }
        );
      }

      const dbUser = await getUserByGithubId(String(user.id));
      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user is a developer
      if (!dbUser.developer) {
        return NextResponse.json(
          { success: false, error: "Unauthorized - Developer access required" },
          { status: 403 }
        );
      }

      const migrationResult = await migrateAllUsersToPersonalEnterprises();
      return NextResponse.json({
        success: true,
        message: `Migration completed. Processed ${migrationResult.total} users.`,
        data: migrationResult,
      });
    }

    // Debug action to check user's enterprise associations
    if (action === "debugUserEnterprises") {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("github_user");

      if (!userCookie) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      let user = null;
      try {
        user = JSON.parse(userCookie.value);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid user session" },
          { status: 401 }
        );
      }

      const dbUser = await getUserByGithubId(String(user.id));
      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Get all enterprise associations for this user
      const userEnterprises = await db
        .select({
          enterpriseId: enterpriseUsers.enterpriseId,
          role: enterpriseUsers.role,
          enterpriseName: enterprises.name,
        })
        .from(enterpriseUsers)
        .innerJoin(
          enterprises,
          eq(enterprises.id, enterpriseUsers.enterpriseId)
        )
        .where(eq(enterpriseUsers.userId, dbUser.id));

      return NextResponse.json({
        success: true,
        data: {
          userId: dbUser.id,
          githubId: dbUser.githubId,
          enterprises: userEnterprises,
        },
      });
    }

    // Debug action to check specific invite code and user status
    if (action === "debugInviteCode") {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("github_user");

      if (!userCookie) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      let user = null;
      try {
        user = JSON.parse(userCookie.value);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid user session" },
          { status: 401 }
        );
      }

      const dbUser = await getUserByGithubId(String(user.id));
      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const { code } = params;
      if (!code) {
        return NextResponse.json(
          { success: false, error: "Invite code is required" },
          { status: 400 }
        );
      }

      // Import the schema
      const { enterpriseInviteCodes } = await import("@/server/src/db/schema");

      // Get invite code details
      const inviteCodeDetails = await db
        .select()
        .from(enterpriseInviteCodes)
        .where(eq(enterpriseInviteCodes.code, code))
        .limit(1);

      if (inviteCodeDetails.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            inviteCode: code,
            inviteCodeExists: false,
            message: "Invite code not found",
          },
        });
      }

      const inviteCode = inviteCodeDetails[0];

      // Check if user is already associated with this enterprise
      const userEnterpriseStatus = await db
        .select()
        .from(enterpriseUsers)
        .where(
          and(
            eq(enterpriseUsers.enterpriseId, inviteCode.enterpriseId),
            eq(enterpriseUsers.userId, dbUser.id)
          )
        )
        .limit(1);

      // Get enterprise details
      const enterpriseDetails = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.id, inviteCode.enterpriseId))
        .limit(1);

      return NextResponse.json({
        success: true,
        data: {
          inviteCode: code,
          inviteCodeExists: true,
          inviteCodeDetails: {
            enterpriseId: inviteCode.enterpriseId,
            role: inviteCode.role,
            used: inviteCode.used,
            usedBy: inviteCode.usedBy,
            usedAt: inviteCode.usedAt,
            expiresAt: inviteCode.expiresAt,
            createdAt: inviteCode.createdAt,
          },
          enterpriseDetails: enterpriseDetails[0] || null,
          userStatus:
            userEnterpriseStatus.length > 0
              ? {
                  role: userEnterpriseStatus[0].role,
                  isAdmin: userEnterpriseStatus[0].role === "admin",
                  isMember: userEnterpriseStatus[0].role === "member",
                }
              : null,
          userId: dbUser.id,
          githubId: dbUser.githubId,
        },
      });
    }

    let result: ServiceResponse<any>;
    switch (action) {
      case "createEnterprise":
        result = await createEnterpriseService(params);
        break;
      case "generateMemberInviteCode":
        result = await generateMemberInviteCodeService(params);
        break;
      case "generateAdminInviteCode":
        result = await generateAdminInviteCodeService(params);
        break;
      case "redeemInviteCode":
        result = await redeemInviteCodeService(params);
        break;
      default:
        return NextResponse.json(
          { success: false, status: 400, error: "Unknown action" },
          { status: 400 }
        );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        {
          success: false,
          status: err.status,
          error: err.message,
          code: err.code,
        },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, status: 500, error: "Internal error" },
      { status: 500 }
    );
  }
}
