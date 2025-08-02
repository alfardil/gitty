import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the backend URL based on environment
    const isProd = process.env.NODE_ENV === "production";
    const baseUrl = isProd
      ? "https://devboard-api.fly.dev"
      : "http://localhost:8000";

    const backendUrl = `${baseUrl}/user-insights/stream-analyze`;

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = "Failed to start analysis";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorMessage = `Backend error: ${response.status} ${response.statusText}`;
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in user insights stream API route:", error);

    let errorMessage = "Internal server error";
    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage =
        "Backend server is not available. Please ensure the backend is running.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
