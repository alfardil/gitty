import { NextRequest, NextResponse } from "next/server";
import {
  getAdminEnterprisesService,
  getEnterpriseUsersService,
  getUserEnterprisesService,
  ServiceError,
  ServiceResponse,
} from "@/server/src/services/enterprise.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    let result: ServiceResponse<any>;
    switch (action) {
      case "getAdminEnterprises": {
        const userId = searchParams.get("userId") || "";
        result = await getAdminEnterprisesService(userId);
        break;
      }
      case "getUserEnterprises": {
        const userId = searchParams.get("userId") || "";
        result = await getUserEnterprisesService(userId);
        break;
      }
      case "getEnterpriseUsers": {
        const enterpriseId = searchParams.get("enterpriseId") || "";
        result = await getEnterpriseUsersService(enterpriseId);
        break;
      }
      default:
        return NextResponse.json(
          { success: false, status: 400, error: "Unknown action" },
          { status: 400 }
        );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          success: false,
          status: error.status,
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, status: 500, error: "Internal error" },
      { status: 500 }
    );
  }
}
