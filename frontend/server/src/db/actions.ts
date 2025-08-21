"use server";

import {
  users as usersTable,
  sessions as sessionsTable,
  waitlistEmails,
  enterprises,
  enterpriseUsers,
  enterpriseInviteCodes,
  enterpriseRole,
  projects,
} from "./schema";
import { eq, sql, and } from "drizzle-orm";
import { db } from ".";
import { randomBytes } from "crypto";

export async function upsertUser({
  githubId,
  firstName,
  lastName,
  email,
  avatarUrl,
  githubUsername,
  bio,
  joinedAt,
}: {
  githubId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  githubUsername?: string;
  bio?: string;
  joinedAt?: Date;
}) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.githubId, githubId));
  if (existing.length > 0) {
    await db
      .update(usersTable)
      .set({
        firstName,
        lastName,
        email,
        avatarUrl,
        githubUsername,
        bio,
      })
      .where(eq(usersTable.githubId, githubId));

    // For existing users, ensure they have personal enterprise and project
    await ensurePersonalEnterpriseAndProject(existing[0].id, githubUsername);

    return { updated: true, user: existing[0] };
  } else {
    const inserted = await db
      .insert(usersTable)
      .values({
        githubId,
        githubUsername,
        firstName,
        lastName,
        email,
        joinedAt: joinedAt ? joinedAt.toISOString() : undefined,
        avatarUrl,
        bio,
        developer: false,
      })
      .returning();

    // For new users, automatically create personal enterprise and project
    await ensurePersonalEnterpriseAndProject(inserted[0].id, githubUsername);

    return { created: true, user: inserted[0] };
  }
}

export async function updateUsernameByGithubId(
  githubId: string,
  newUsername: string
) {
  await db
    .update(usersTable)
    .set({ username: newUsername })
    .where(eq(usersTable.githubId, githubId));
}

export async function addAnalyzedReposCountDB(githubId: string) {
  await db
    .update(usersTable)
    .set({ analyzedReposCount: sql`${usersTable.analyzedReposCount} + 1` })
    .where(eq(usersTable.githubId, githubId));
}

export async function isUserDeveloper(githubId: string): Promise<boolean> {
  const user = await db
    .select({ developer: usersTable.developer })
    .from(usersTable)
    .where(eq(usersTable.githubId, githubId))
    .limit(1);

  return user.length > 0 && user[0].developer === true;
}

export async function getUserByGithubId(githubId: string) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.githubId, githubId))
    .limit(1);

  return user[0] || null;
}

export async function getUserByUUID(uuid: string) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uuid))
    .limit(1);

  return user[0] || null;
}

export async function createSession({
  userId,
  expiresAt,
  deletedAt,
}: {
  userId: string;
  expiresAt: Date;
  deletedAt?: Date | null;
}) {
  const inserted = await db
    .insert(sessionsTable)
    .values(
      deletedAt
        ? {
            userId,
            expiresAt: expiresAt.toISOString(),
            deletedAt: deletedAt.toISOString(),
          }
        : { userId, expiresAt: expiresAt.toISOString() }
    )
    .returning();
  return { created: true, session: inserted[0] };
}

export async function getSessionById({ id }: { id: string }) {
  const session = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);

  return session[0] || null;
}

export async function validateSession({ sessionId }: { sessionId: string }) {
  const session = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.id, sessionId),
        sql`${sessionsTable.expiresAt} > NOW()`,
        sql`${sessionsTable.deletedAt} IS NULL`
      )
    )
    .limit(1);

  return session[0] || null;
}

export async function deleteSession({ id }: { id: string }) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
}

export async function deleteSessionsByUserId({ userId }: { userId: string }) {
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
}

export async function cleanupExpiredSessions() {
  const result = await db
    .delete(sessionsTable)
    .where(sql`${sessionsTable.expiresAt} <= NOW()`)
    .returning({ id: sessionsTable.id });

  return result.length;
}

export async function getRowCount(): Promise<number> {
  const result = await db.execute<{ count: number }>(
    sql`SELECT COUNT(*) as count FROM repo_chunks`
  );

  const rows = result.rows as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function addWaitlistEmail(email: string) {
  await db.insert(waitlistEmails).values({ email });
}

export async function createEnterprise({
  name,
  ownerUserId,
}: {
  name: string;
  ownerUserId: string;
}) {
  const inserted = await db.insert(enterprises).values({ name }).returning();
  const enterprise = inserted[0];
  // Don't automatically add owner as admin - they need to redeem an invite code
  return enterprise;
}

export async function createPersonalEnterprise(
  userId: string,
  githubUsername?: string
) {
  const personalName = githubUsername
    ? `${githubUsername}'s Personal`
    : "Personal";
  const enterprise = await createEnterprise({
    name: personalName,
    ownerUserId: userId,
  });
  // For personal enterprises, automatically add the user as admin
  await db.insert(enterpriseUsers).values({
    enterpriseId: enterprise.id,
    userId: userId,
    role: "admin",
  });
  return enterprise;
}

export async function createPersonalProject(
  enterpriseId: string,
  userId: string
) {
  const inserted = await db
    .insert(projects)
    .values({
      name: "Personal Project",
      description: "Default personal project for organizing tasks",
      enterpriseId,
      createdById: userId,
      memberIds: [userId],
    })
    .returning();
  return inserted[0];
}

export async function ensurePersonalEnterpriseAndProject(
  userId: string,
  githubUsername?: string
) {
  // Check if user already has any enterprise
  const existingEnterprises = await db
    .select()
    .from(enterpriseUsers)
    .where(eq(enterpriseUsers.userId, userId))
    .limit(1);

  if (existingEnterprises.length > 0) {
    // User already has enterprises, no need to create personal ones
    return null;
  }

  // Create personal enterprise
  const personalEnterprise = await createPersonalEnterprise(
    userId,
    githubUsername
  );

  // Create personal project within that enterprise
  const personalProject = await createPersonalProject(
    personalEnterprise.id,
    userId
  );

  return {
    enterprise: personalEnterprise,
    project: personalProject,
  };
}

export async function migrateAllUsersToPersonalEnterprises() {
  // Get all users who don't have any enterprise
  const usersWithoutEnterprises = await db
    .select({
      id: usersTable.id,
      githubUsername: usersTable.githubUsername,
    })
    .from(usersTable)
    .leftJoin(enterpriseUsers, eq(usersTable.id, enterpriseUsers.userId))
    .where(sql`${enterpriseUsers.userId} IS NULL`);

  const results = [];
  for (const user of usersWithoutEnterprises) {
    try {
      const result = await ensurePersonalEnterpriseAndProject(
        user.id,
        user.githubUsername || undefined
      );
      results.push({
        userId: user.id,
        success: true,
        result,
      });
    } catch (error) {
      results.push({
        userId: user.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    total: usersWithoutEnterprises.length,
    results,
  };
}

export async function generateEnterpriseInviteCode({
  enterpriseId,
  expiresAt,
  role = "member",
}: {
  enterpriseId: string;
  expiresAt?: Date;
  role?: "admin" | "member";
}) {
  const code = randomBytes(16).toString("hex");
  await db.insert(enterpriseInviteCodes).values({
    code,
    enterpriseId,
    expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
    role,
  });
  return code;
}

export async function redeemEnterpriseInviteCodeForMember({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  const invite = await db
    .select()
    .from(enterpriseInviteCodes)
    .where(eq(enterpriseInviteCodes.code, code))
    .limit(1);
  const inviteCode = invite[0];
  if (!inviteCode) throw new Error("Invalid invite code");
  if (inviteCode.used) throw new Error("Invite code already used");
  if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date())
    throw new Error("Invite code expired");

  const existing = await db
    .select()
    .from(enterpriseUsers)
    .where(
      and(
        eq(enterpriseUsers.enterpriseId, inviteCode.enterpriseId),
        eq(enterpriseUsers.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    const userRole = existing[0].role;
    throw createEnterpriseUserError(userRole);
  }

  await db.insert(enterpriseUsers).values({
    enterpriseId: inviteCode.enterpriseId,
    userId,
    role: inviteCode.role,
  });

  await db
    .update(enterpriseInviteCodes)
    .set({ used: true, usedBy: userId, usedAt: new Date().toISOString() })
    .where(eq(enterpriseInviteCodes.code, code));
  return true;
}

export async function redeemEnterpriseInviteCodeForAdmin({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  // Find invite code
  const invite = await db
    .select()
    .from(enterpriseInviteCodes)
    .where(eq(enterpriseInviteCodes.code, code))
    .limit(1);
  const inviteCode = invite[0];
  if (!inviteCode) throw new Error("Invalid invite code");
  if (inviteCode.used) throw new Error("Invite code already used");
  if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date())
    throw new Error("Invite code expired");

  // Check if user is already a member
  const existing = await db
    .select()
    .from(enterpriseUsers)
    .where(
      and(
        eq(enterpriseUsers.enterpriseId, inviteCode.enterpriseId),
        eq(enterpriseUsers.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].role === "admin") {
      throw createEnterpriseUserError("admin");
    } else {
      // Upgrade member to admin
      await db
        .update(enterpriseUsers)
        .set({ role: "admin" })
        .where(
          and(
            eq(enterpriseUsers.enterpriseId, inviteCode.enterpriseId),
            eq(enterpriseUsers.userId, userId)
          )
        );
    }
  } else {
    await db.insert(enterpriseUsers).values({
      enterpriseId: inviteCode.enterpriseId,
      userId,
      role: inviteCode.role,
    });
  }

  // Mark the invite code as used (this was missing for the upgrade case)
  await db
    .update(enterpriseInviteCodes)
    .set({ used: true, usedBy: userId, usedAt: new Date().toISOString() })
    .where(eq(enterpriseInviteCodes.code, code));
  return true;
}

export async function isUserAdminOfAnyEnterprise(
  userId: string
): Promise<boolean> {
  const result = await db
    .select()
    .from(enterpriseUsers)
    .where(
      and(eq(enterpriseUsers.userId, userId), eq(enterpriseUsers.role, "admin"))
    )
    .limit(1);
  return result.length > 0;
}

function createEnterpriseUserError(userRole: string) {
  let err: any;
  if (userRole === "admin") {
    err = new Error("User is already an admin of this enterprise.");
  } else {
    err = new Error("User is already a member of this enterprise.");
  }
  err.code = "ALREADY_MEMBER";
  return err;
}
