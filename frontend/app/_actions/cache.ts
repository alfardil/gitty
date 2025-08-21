"use server";

import { db } from "@/server/src/db";
import { eq, and } from "drizzle-orm";
import { diagramCache, readmeCache } from "@/server/src/db/schema";
import { sql } from "drizzle-orm";
import { getRowCount } from "@/server/src/db/actions";
import { getUserByGithubId } from "@/server/src/db/actions";
import { updateUsernameByGithubId } from "@/server/src/db/actions";
import { addAnalyzedReposCountDB } from "@/server/src/db/actions";

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
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [diagramCache.username, diagramCache.repo],
        set: {
          diagram,
          explanation,
          updatedAt: new Date().toISOString(),
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

export async function getAnalyzedReposCount(
  githubId: string
): Promise<number | null> {
  try {
    const user = await getUserByGithubId(githubId);
    return user?.analyzedReposCount ?? null;
  } catch (error) {
    console.error("Error fetching analyzedReposCount:", error);
    return null;
  }
}

export async function getSubscriptionPlan(githubId: string) {
  try {
    const user = await getUserByGithubId(githubId);
    return user?.subscriptionPlan ?? null;
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
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

export async function setUsername(githubId: string, newUsername: string) {
  return await updateUsernameByGithubId(githubId, newUsername);
}

export async function getUsername(githubId: string): Promise<string | null> {
  const user = await getUserByGithubId(githubId);
  return user?.username ?? null;
}

export async function addAnalyzedReposCount(githubId: string): Promise<void> {
  try {
    await addAnalyzedReposCountDB(githubId);
  } catch (error) {
    console.error("Error incrementing analyzedReposCount:", error);
  }
}

// README Cache Functions
export async function getCachedReadme(username: string, repo: string) {
  try {
    const cached = await db
      .select()
      .from(readmeCache)
      .where(
        and(eq(readmeCache.username, username), eq(readmeCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.readme ?? null;
  } catch (error) {
    console.error("Error fetching cached README:", error);
    return null;
  }
}

export async function getCachedReadmeInstructions(
  username: string,
  repo: string
) {
  try {
    const cached = await db
      .select()
      .from(readmeCache)
      .where(
        and(eq(readmeCache.username, username), eq(readmeCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.instructions ?? null;
  } catch (error) {
    console.error("Error fetching cached README instructions:", error);
    return null;
  }
}

export async function getLastReadmeGeneratedDate(
  username: string,
  repo: string
) {
  try {
    const cached = await db
      .select({
        updatedAt: readmeCache.updatedAt,
      })
      .from(readmeCache)
      .where(
        and(eq(readmeCache.username, username), eq(readmeCache.repo, repo))
      )
      .limit(1);

    return cached[0]?.updatedAt ?? null;
  } catch (error) {
    console.error("Error fetching last README generated date:", error);
    return null;
  }
}

export async function cacheReadme(
  username: string,
  repo: string,
  readme: string,
  instructions?: string
) {
  try {
    await db
      .insert(readmeCache)
      .values({
        username,
        repo,
        readme,
        instructions,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [readmeCache.username, readmeCache.repo],
        set: {
          readme,
          instructions,
          updatedAt: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error("Error caching README:", error);
  }
}
