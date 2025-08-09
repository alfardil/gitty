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
