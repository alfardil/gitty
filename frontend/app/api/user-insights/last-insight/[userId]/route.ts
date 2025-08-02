import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const enterpriseId = searchParams.get("enterprise_id");

    const isProd = process.env.NODE_ENV === "production";
    const baseUrl = isProd
      ? "https://devboard-api.fly.dev"
      : "http://localhost:8000";

    const url = new URL(`${baseUrl}/user-insights/last-insight/${userId}`);
    if (enterpriseId) {
      url.searchParams.set("enterprise_id", enterpriseId);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch last insight" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching last insight:", error);
    return NextResponse.json(
      { error: "Failed to fetch last insight" },
      { status: 500 }
    );
  }
}
