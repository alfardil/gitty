import { db } from "@/server/src/db";
import { enterprises, enterpriseInviteCodes } from "@/server/src/db/schema";
import {
  createEnterprise,
  generateEnterpriseInviteCode,
  redeemEnterpriseInviteCodeForMember,
  redeemEnterpriseInviteCodeForAdmin,
} from "@/server/src/db/actions";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { enterpriseUsers, users } from "@/server/src/db/schema";

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: string; code?: string };

export class ServiceError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const createEnterpriseSchema = z.object({
  name: z.string().min(2).max(255),
  ownerUserId: z.string().uuid(),
});
export const generateInviteCodeSchema = z.object({
  enterpriseId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});
export const redeemInviteCodeSchema = z.object({
  code: z.string().min(1),
  userId: z.string().uuid(),
});

export async function createEnterpriseService(
  params: z.infer<typeof createEnterpriseSchema>
): Promise<ServiceResponse<{ enterprise: any }>> {
  const parse = createEnterpriseSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { name, ownerUserId } = parse.data;
  const existing = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.name, name));
  if (existing.length > 0) {
    throw new ServiceError(
      "Enterprise name taken. Please choose a different name.",
      409,
      "conflict"
    );
  }
  const enterprise = await createEnterprise({ name, ownerUserId });
  return { success: true, data: { enterprise } };
}

export async function generateMemberInviteCodeService(
  params: z.infer<typeof generateInviteCodeSchema>
): Promise<ServiceResponse<{ code: string }>> {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { enterpriseId, expiresAt } = parse.data;
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    throw new ServiceError(
      "Enterprise not found. Please check the Enterprise ID.",
      404,
      "not_found"
    );
  }
  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "member",
  });
  return { success: true, data: { code } };
}

export async function generateAdminInviteCodeService(
  params: z.infer<typeof generateInviteCodeSchema>
): Promise<ServiceResponse<{ code: string }>> {
  const parse = generateInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { enterpriseId, expiresAt } = parse.data;
  const enterprise = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.id, enterpriseId));
  if (enterprise.length === 0) {
    throw new ServiceError(
      "Enterprise not found. Please check the Enterprise ID.",
      404,
      "not_found"
    );
  }
  const code = await generateEnterpriseInviteCode({
    enterpriseId,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    role: "admin",
  });
  return { success: true, data: { code } };
}

export async function redeemInviteCodeService(
  params: z.infer<typeof redeemInviteCodeSchema>
): Promise<ServiceResponse<{ role: string }>> {
  const parse = redeemInviteCodeSchema.safeParse(params);
  if (!parse.success)
    throw new ServiceError("Validation failed", 400, "validation");
  const { code, userId } = parse.data;
  const invite = await db
    .select()
    .from(enterpriseInviteCodes)
    .where(eq(enterpriseInviteCodes.code, code))
    .limit(1);
  const inviteCode = invite[0];
  if (!inviteCode) {
    throw new ServiceError("Invalid invite code", 400, "invalid_code");
  }
  try {
    if (inviteCode.role === "admin") {
      await redeemEnterpriseInviteCodeForAdmin({ code, userId });
      return { success: true, data: { role: "admin" } };
    } else {
      await redeemEnterpriseInviteCodeForMember({ code, userId });
      return { success: true, data: { role: "member" } };
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ALREADY_MEMBER"
    ) {
      if (inviteCode.role === "admin") {
        throw new ServiceError(
          "Already an admin of this enterprise!",
          409,
          "already_admin"
        );
      } else {
        throw new ServiceError(
          "Already a member of this enterprise!",
          409,
          "already_member"
        );
      }
    }
    if (
      error instanceof Error &&
      error.message === "Invite code already used"
    ) {
      throw new ServiceError("Invite code already used", 400, "used_code");
    }
    if (error instanceof Error && error.message === "Invalid invite code") {
      throw new ServiceError("Invalid invite code", 400, "invalid_code");
    }
    throw error;
  }
}

export async function getAdminEnterprisesService(
  userId: string
): Promise<ServiceResponse<{ enterprises: any[] }>> {
  if (!userId) throw new ServiceError("Missing userId", 400, "missing_userId");
  try {
    const adminEnterprises = await db
      .select({
        id: enterprises.id,
        name: enterprises.name,
        createdAt: enterprises.createdAt,
        updatedAt: enterprises.updatedAt,
      })
      .from(enterprises)
      .innerJoin(
        enterpriseUsers,
        and(
          eq(enterpriseUsers.enterpriseId, enterprises.id),
          eq(enterpriseUsers.userId, userId),
          eq(enterpriseUsers.role, "admin")
        )
      );
    return { success: true, data: { enterprises: adminEnterprises } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    throw new ServiceError(errorMessage, 500, "db_error");
  }
}

export async function getEnterpriseUsersService(
  enterpriseId: string
): Promise<ServiceResponse<{ users: any[] }>> {
  if (!enterpriseId)
    throw new ServiceError("Missing enterpriseId", 400, "missing_enterpriseId");
  try {
    const usersInEnterprise = await db
      .select({
        id: users.id,
        avatarUrl: users.avatarUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionPlan: users.subscriptionPlan,
        role: enterpriseUsers.role,
      })
      .from(enterpriseUsers)
      .innerJoin(users, eq(enterpriseUsers.userId, users.id))
      .where(eq(enterpriseUsers.enterpriseId, enterpriseId));
    return { success: true, data: { users: usersInEnterprise } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal error";
    throw new ServiceError(errorMessage, 500, "db_error");
  }
}
