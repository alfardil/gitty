import { NextRequest, NextResponse } from "next/server";
import {
  createEnterpriseService,
  generateMemberInviteCodeService,
  generateAdminInviteCodeService,
  redeemInviteCodeService,
  ServiceError,
  ServiceResponse,
} from "@/server/src/services/enterprise.service";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();
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
