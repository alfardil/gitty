"use server";

import {
  users as usersTable,
  sessions as sessionsTable,
  waitlistEmails,
} from "./schema";
import { eq, sql } from "drizzle-orm";
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
      .set({
        firstName,
        lastName,
        email,
        avatarUrl,
        githubUsername,
        bio,
      })
      .where(eq(usersTable.githubId, githubId));
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
        admin: false,
      })
      .returning();
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

export async function deleteSession({ id }: { id: string }) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
}

export async function deleteSessionsByUserId({ userId }: { userId: string }) {
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
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
