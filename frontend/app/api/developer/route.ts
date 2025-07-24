import { NextRequest, NextResponse } from "next/server";
import {
  createEnterprise,
  generateEnterpriseInviteCode,
  redeemEnterpriseInviteCodeForMember,
} from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { enterprises } from "@/server/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { enterpriseInviteCodes } from "@/server/src/db/schema";
import { redeemEnterpriseInviteCodeForAdmin } from "@/server/src/db/actions";

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
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "createEnterprise":
        return handleCreateEnterprise(params);
      case "generateInviteCode":
        return handleGenerateInviteCode(params);
      case "generateMemberInviteCode":
        return handleGenerateMemberInviteCode(params);
      case "generateAdminInviteCode":
        return handleGenerateAdminInviteCode(params);
      case "redeemInviteCode":
        return handleRedeemInviteCode(params);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
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

async function handleCreateEnterprise(params: any) {
  const parse = createEnterpriseSchema.safeParse(params);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

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

async function handleGenerateInviteCode(params: any) {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { enterpriseId, expiresAt } = parse.data;
  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });
  return NextResponse.json({ success: true, code });
}

async function handleGenerateMemberInviteCode(params: any) {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { enterpriseId, expiresAt } = parse.data;

  // Check if enterprise exists
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    return NextResponse.json(
      { error: "Enterprise not found. Please check the Enterprise ID." },
      { status: 404 }
    );
  }

  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "member",
  });
  return NextResponse.json({ success: true, code });
}

async function handleGenerateAdminInviteCode(params: any) {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { enterpriseId, expiresAt } = parse.data;

  // Check if enterprise exists
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    return NextResponse.json(
      { error: "Enterprise not found. Please check the Enterprise ID." },
      { status: 404 }
    );
  }

  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "admin",
  });
  return NextResponse.json({ success: true, code });
}

async function handleRedeemInviteCode(params: any) {
  const parse = redeemInviteCodeSchema.safeParse(params);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.issues }, { status: 400 });

  const { code, userId } = parse.data;

  const invite = await db
    .select()
    .from(enterpriseInviteCodes)
    .where(eq(enterpriseInviteCodes.code, code))
    .limit(1);

  const inviteCode = invite[0];
  if (!inviteCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  try {
    if (inviteCode.role === "admin") {
      await redeemEnterpriseInviteCodeForAdmin({ code, userId });
      return NextResponse.json({ success: true, role: "admin" });
    } else {
      await redeemEnterpriseInviteCodeForMember({ code, userId });
      return NextResponse.json({ success: true, role: "member" });
    }
  } catch (error: any) {
    if (error.code === "ALREADY_MEMBER") {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: String(
              error.message || "You are already a member of this enterprise."
            ),
          },
        },
        { status: 409 }
      );
    }
    if (error.message === "Invite code already used") {
      return NextResponse.json(
        { error: "Invite code already used" },
        { status: 400 }
      );
    }
    if (error.message === "Invalid invite code") {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }
    throw error;
  }
}
