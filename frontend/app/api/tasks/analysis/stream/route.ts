import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUserByGithubId } from "@/server/src/db/actions";
import { db } from "@/server/src/db";
import { tasks } from "@/server/src/db/schema";
import { eq, and } from "drizzle-orm";
import { analyzeTaskInBackground } from "@/server/src/services/task-analysis.service";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return new Response("Unauthorized", { status: 401 });
    }

    let user = null;
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      return new Response("Invalid user session", { status: 401 });
    }

    const dbUser = await getUserByGithubId(String(user.id));
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");
    const projectId = searchParams.get("projectId");

    if (!enterpriseId || !projectId) {
      return new Response("Missing enterpriseId or projectId", { status: 400 });
    }

    // Set up SSE headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isConnectionActive = true;

        const sendEvent = (data: any) => {
          if (!isConnectionActive) return;
          try {
            const event = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(event));
          } catch (error) {
            console.error("Error sending SSE event:", error);
            isConnectionActive = false;
          }
        };

        // Send initial connection confirmation
        sendEvent({ type: "connected", message: "SSE connection established" });

        // Function to check for task analysis updates
        const checkForUpdates = async () => {
          if (!isConnectionActive) return;

          try {
            // Get tasks that are being analyzed (missing analysis fields)
            const analyzingTasks = await db
              .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                priority: tasks.priority,
                dueDate: tasks.dueDate,
                tags: tasks.tags,
                estimatedHours: tasks.estimatedHours,
                complexity: tasks.complexity,
                taskType: tasks.taskType,
                updatedAt: tasks.updatedAt,
              })
              .from(tasks)
              .where(
                and(
                  eq(tasks.enterpriseId, enterpriseId),
                  eq(tasks.projectId, projectId)
                )
              );

            // Check for tasks that need analysis and trigger streaming analysis
            for (const task of analyzingTasks) {
              if (!isConnectionActive) break;

              if (!task.estimatedHours || !task.complexity || !task.taskType) {
                // Task needs analysis - trigger streaming analysis
                sendEvent({
                  type: "analysis_started",
                  taskId: task.id,
                  message: "Starting AI analysis...",
                });

                // Try to call the backend streaming analysis endpoint
                try {
                  const analysisResponse = await fetch(
                    `${process.env.BACKEND_URL || "http://localhost:8000"}/task-analysis/stream-analyze`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        due_date: task.dueDate,
                        tags: task.tags,
                      }),
                    }
                  );

                  if (analysisResponse.ok) {
                    const reader = analysisResponse.body?.getReader();
                    if (reader) {
                      const decoder = new TextDecoder();
                      let buffer = "";

                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                          if (line.startsWith("data: ")) {
                            try {
                              const data = JSON.parse(line.slice(6));

                              // Forward the analysis status to the client
                              sendEvent({
                                type: "analysis_progress",
                                taskId: task.id,
                                status: data.status,
                                message: data.message,
                                result: data.result,
                              });

                              // If analysis is complete, update the task in the database
                              if (data.status === "complete" && data.result) {
                                await db
                                  .update(tasks)
                                  .set({
                                    estimatedHours:
                                      data.result.estimated_hours.toString(),
                                    complexity: data.result.complexity,
                                    taskType: data.result.task_type,
                                    updatedAt: new Date().toISOString(),
                                  })
                                  .where(eq(tasks.id, task.id));

                                sendEvent({
                                  type: "task_analyzed",
                                  taskId: task.id,
                                  task: {
                                    id: task.id,
                                    title: task.title,
                                    estimatedHours: data.result.estimated_hours,
                                    complexity: data.result.complexity,
                                    taskType: data.result.task_type,
                                  },
                                });
                              }
                            } catch (parseError) {
                              console.error(
                                "Error parsing SSE data:",
                                parseError
                              );
                            }
                          }
                        }
                      }
                    }
                  } else {
                    throw new Error(
                      `Backend responded with status: ${analysisResponse.status}`
                    );
                  }
                } catch (error) {
                  console.error("Error calling streaming analysis:", error);

                  // Fallback: Let the background analysis handle it
                  sendEvent({
                    type: "analysis_progress",
                    taskId: task.id,
                    status: "fallback",
                    message: "Using background analysis (backend unavailable)",
                  });

                  // Trigger background analysis
                  try {
                    await analyzeTaskInBackground(task.id);
                    sendEvent({
                      type: "analysis_progress",
                      taskId: task.id,
                      status: "background_started",
                      message: "Background analysis started",
                    });
                  } catch (backgroundError) {
                    console.error(
                      "Background analysis failed:",
                      backgroundError
                    );
                    sendEvent({
                      type: "analysis_error",
                      taskId: task.id,
                      message: "Background analysis failed",
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error checking for task updates:", error);
            sendEvent({ type: "error", message: "Error checking for updates" });
          }
        };

        // Check for updates every 2 seconds
        const interval = setInterval(checkForUpdates, 2000);

        // Clean up on connection close
        request.signal.addEventListener("abort", () => {
          isConnectionActive = false;
          clearInterval(interval);
          controller.close();
        });

        // Initial check
        await checkForUpdates();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
