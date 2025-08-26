import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the backend URL based on environment
    const isProd = process.env.NODE_ENV === "production";
    const baseUrl = isProd
      ? process.env.NEXT_PUBLIC_API_DEV_URL
      : "http://localhost:8000";

    const backendUrl = `${baseUrl}/user-insights/analyze`;

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to generate user insights" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in user insights API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
