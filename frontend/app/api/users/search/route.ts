import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { users } from "@/server/src/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Search for users by email (case-insensitive)
    const foundUsers = await db
      .select({
        id: users.id,
        email: users.email,
        githubUsername: users.githubUsername,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(ilike(users.email, `%${email}%`))
      .limit(5);

    return NextResponse.json({ users: foundUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
