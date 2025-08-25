import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface TaskAnalysisUpdate {
  type:
    | "connected"
    | "task_analyzed"
    | "analysis_started"
    | "analysis_progress"
    | "analysis_error"
    | "error";
  message?: string;
  taskId?: string;
  status?: string;
  result?: {
    estimated_hours: number;
    complexity: number;
    task_type: string;
    confidence: number;
    reasoning: string;
  };
  task?: {
    id: string;
    title: string;
    estimatedHours: number;
    complexity: number;
    taskType: string;
  };
}

export function useTaskAnalysisStream(
  enterpriseId?: string,
  projectId?: string
) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectToStream = useCallback(() => {
    if (!enterpriseId || !projectId) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/tasks/analysis/stream?enterpriseId=${enterpriseId}&projectId=${projectId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection opened for task analysis");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: TaskAnalysisUpdate = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            console.log("SSE connected:", data.message);
            break;

          case "analysis_started":
            console.log(
              "Analysis started for task:",
              data.taskId,
              data.message
            );
            break;

          case "analysis_progress":
            console.log(
              "Analysis progress for task:",
              data.taskId,
              data.status,
              data.message
            );

            // Optimistically reflect partial/final result in the UI
            if (data.result && data.taskId) {
              queryClient.setQueryData(
                ["tasks", enterpriseId, projectId],
                (oldTasks: any[]) => {
                  if (!oldTasks) return oldTasks;

                  return oldTasks.map((task) =>
                    task.id === data.taskId
                      ? {
                          ...task,
                          estimatedHours: data.result!.estimated_hours,
                          complexity: data.result!.complexity,
                          taskType: data.result!.task_type,
                        }
                      : task
                  );
                }
              );
            }
            break;

          case "task_analyzed":
            if (data.taskId && data.task) {
              console.log("Task analyzed:", data.taskId, data.task);

              // Optimistically update the task in the cache
              queryClient.setQueryData(
                ["tasks", enterpriseId, projectId],
                (oldTasks: any[]) => {
                  if (!oldTasks) return oldTasks;

                  return oldTasks.map((task) =>
                    task.id === data.taskId
                      ? {
                          ...task,
                          estimatedHours: data.task!.estimatedHours,
                          complexity: data.task!.complexity,
                          taskType: data.task!.taskType,
                        }
                      : task
                  );
                }
              );
            }
            break;

          case "analysis_error":
            console.error(
              "Analysis error for task:",
              data.taskId,
              data.message
            );
            break;

          case "error":
            console.error("SSE error:", data.message);
            break;
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connectToStream();
        }
      }, 5000);
    };

    return eventSource;
  }, [enterpriseId, projectId, queryClient]);

  useEffect(() => {
    const eventSource = connectToStream();

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSourceRef.current = null;
      }
    };
  }, [connectToStream]);

  // Return a function to manually reconnect if needed
  const reconnect = useCallback(() => {
    connectToStream();
  }, [connectToStream]);

  return { reconnect };
}
