"use server";

import { db } from "@/server/src/db";
import { eq, and } from "drizzle-orm";
import { diagramCache } from "@/server/src/db/schema";
import { sql } from "drizzle-orm";
import { getRowCount } from "@/server/src/db/actions";

export async function getCachedDiagram(username: string, repo: string) {
  try {
    const cached = await db
      .select()
      .from(diagramCache)
      .where(
        and(eq(diagramCache.username, username), eq(diagramCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.diagram ?? null;
  } catch (error) {
    console.error("Error fetching cached diagram:", error);
    return null;
  }
}

export async function getCachedExplanation(username: string, repo: string) {
  try {
    const cached = await db
      .select()
      .from(diagramCache)
      .where(
        and(eq(diagramCache.username, username), eq(diagramCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.explanation ?? null;
  } catch (error) {
    console.error("Error fetching cached explanation:", error);
    return null;
  }
}

export async function getLastGeneratedDate(username: string, repo: string) {
  try {
    const cached = await db
      .select({
        updatedAt: diagramCache.updatedAt,
      })
      .from(diagramCache)
      .where(
        and(eq(diagramCache.username, username), eq(diagramCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.updatedAt ?? null;
  } catch (error) {
    console.error("Error fetching last generated date:", error);
    return null;
  }
}

export async function cacheDiagramAndExplanation(
  username: string,
  repo: string,
  diagram: string,
  explanation: string
) {
  try {
    await db
      .insert(diagramCache)
      .values({
        username,
        repo,
        diagram,
        explanation,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [diagramCache.username, diagramCache.repo],
        set: {
          diagram,
          explanation,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("Error caching diagram:", error);
  }
}

export async function getDiagramAndUserStats(): Promise<{
  totalDiagrams: number;
  totalUsers: number;
} | null> {
  try {
    const stats = await db
      .select({
        totalDiagrams: sql<number>`COUNT(*)`,
        totalUsers: sql<number>`COUNT(DISTINCT ${diagramCache.username})`,
      })
      .from(diagramCache);

    return stats[0];
  } catch (error) {
    console.error("Error getting diagram stats:", error);
    return null;
  }
}

export async function fetchRowCount(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const count = await getRowCount();
    return { success: true, count };
  } catch (error) {
    console.error("Error fetching row count:", error);
    return { success: false, count: 0 };
  }
}
