"use server";

import { drizzle } from "drizzle-orm/node-postgres";
import { usersTable, sessionsTable } from "./schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

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
      })
      .returning();
    return { created: true, user: inserted[0] };
  }
}

export async function createSession({
  userId,
  expiresAt,
  deletedAt,
}: {
  userId: number;
  expiresAt: Date;
  deletedAt?: Date | null;
}) {
  const inserted = await db
    .insert(sessionsTable)
    .values({ userId, expiresAt, deletedAt })
    .returning();
  return { created: true, session: inserted[0] };
}
