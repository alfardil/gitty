"use server";

import { usersTable, sessionsTable } from "./schema";
import { eq } from "drizzle-orm";
import { db } from ".";

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
      .set({ firstName, lastName, email, avatarUrl, githubUsername, bio })
      .where(eq(usersTable.githubId, githubId));
    return { updated: true, user: existing[0] };
  } else {
    const inserted = await db
      .insert(usersTable)
      .values({
        githubId,
        firstName,
        lastName,
        email,
        avatarUrl,
        githubUsername,
        bio,
        joinedAt,
        admin: false,
      })
      .returning();
    return { created: true, user: inserted[0] };
  }
}

export async function isUserAdmin(githubId: string): Promise<boolean> {
  const user = await db
    .select({ admin: usersTable.admin })
    .from(usersTable)
    .where(eq(usersTable.githubId, githubId))
    .limit(1);

  return user.length > 0 && user[0].admin === true;
}

export async function getUserByGithubId(githubId: string) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.githubId, githubId))
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
    .values({ userId, expiresAt, deletedAt })
    .returning();
  return { created: true, session: inserted[0] };
}

export async function deleteSession({ id }: { id: string }) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
}
