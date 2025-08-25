import { useState, useCallback } from "react";

interface TaskAnalysisRequest {
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
  tags?: string[];
}

interface TaskAnalysisResult {
  estimated_hours: number;
  complexity: number;
  task_type: string;
  confidence: number;
  reasoning: string;
}

interface StreamEvent {
  type: "status" | "complete" | "error";
  status?: string;
  message?: string;
  result?: TaskAnalysisResult;
}

export const useTaskAnalysisStream = () => {
  const [streamStatus, setStreamStatus] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(
    async (
      request: TaskAnalysisRequest,
      onStatusUpdate?: (status: string) => void,
      onComplete?: (data: TaskAnalysisResult) => void,
      onError?: (error: string) => void
    ) => {
      setIsStreaming(true);
      setStreamStatus("Starting analysis...");

      try {
        const response = await fetch("/api/task-analysis/stream-analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

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
                const eventData = JSON.parse(line.slice(6));
                const event: StreamEvent = eventData;

                switch (event.type) {
                  case "status":
                    const statusMessage = event.message || "Processing...";
                    setStreamStatus(statusMessage);
                    onStatusUpdate?.(statusMessage);
                    break;
                  case "complete":
                    if (event.result) {
                      onComplete?.(event.result);
                    }
                    setIsStreaming(false);
                    setStreamStatus("Analysis complete");
                    return;
                  case "error":
                    const errorMessage =
                      event.message || "Unknown error occurred";
                    onError?.(errorMessage);
                    setIsStreaming(false);
                    setStreamStatus("Error: " + errorMessage);
                    throw new Error(errorMessage);
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Stream failed";
        setStreamStatus("Error: " + errorMessage);
        onError?.(errorMessage);
        setIsStreaming(false);
        throw error;
      }
    },
    []
  );

  return {
    startStream,
    streamStatus,
    isStreaming,
  };
};
