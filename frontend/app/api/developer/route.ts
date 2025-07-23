import { NextRequest, NextResponse } from "next/server";
import {
  createEnterprise,
  generateEnterpriseInviteCode,
  redeemEnterpriseInviteCode,
} from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { enterprises } from "@/server/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createEnterpriseSchema = z.object({
  name: z.string().min(2).max(255),
  ownerUserId: z.string().uuid(),
});
const generateInviteCodeSchema = z.object({
  enterpriseId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});
const redeemInviteCodeSchema = z.object({
  code: z.string().min(1),
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, ...params } = body;

  try {
    if (action === "createEnterprise") {
      const parse = createEnterpriseSchema.safeParse(params);
      if (!parse.success)
        return NextResponse.json(
          { error: parse.error.flatten() },
          { status: 400 }
        );
      const { name, ownerUserId } = parse.data;

      const existing = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.name, name));
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Enterprise name taken. Please choose a different name." },
          { status: 409 }
        );
      }
      const enterprise = await createEnterprise({ name, ownerUserId });
      return NextResponse.json({ success: true, enterprise });
    }
    if (action === "generateInviteCode") {
      const parse = generateInviteCodeSchema.safeParse(params);
      if (!parse.success)
        return NextResponse.json(
          { error: parse.error.flatten() },
          { status: 400 }
        );
      const { enterpriseId, expiresAt } = parse.data;
      const code = await generateEnterpriseInviteCode({
        enterpriseId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      return NextResponse.json({ success: true, code });
    }
    if (action === "redeemInviteCode") {
      const parse = redeemInviteCodeSchema.safeParse(params);
      if (!parse.success)
        return NextResponse.json(
          { error: parse.error.flatten() },
          { status: 400 }
        );
      const { code, userId } = parse.data;
      await redeemEnterpriseInviteCode({ code, userId });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error.code === "ALREADY_MEMBER") {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 409 }
      );
    }
    // Otherwise, return 500
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Internal error",
        },
      },
      { status: 500 }
    );
  }
}
