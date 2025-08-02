import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export interface UserInsightsRequest {
  userId: string;
  enterpriseId?: string;
}

export interface UserInsightsResponse {
  overallScore: number;
  performanceGrade: string;
  criticalIssues: string[];
  strengths: string[];
  recommendations: string[];
  detailedAnalysis: {
    completionRate: string;
    timeliness: string;
    quality: string;
    efficiency: string;
    reliability: string;
  };
  generatedAt: string;
}

export interface StreamEvent {
  type: "status" | "complete" | "error" | "partial";
  message?: string;
  data?: UserInsightsResponse;
  content?: string;
}

export const useUserInsightsStream = () => {
  const [streamStatus, setStreamStatus] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(
    async (
      request: UserInsightsRequest,
      onStatusUpdate?: (status: string) => void,
      onComplete?: (data: UserInsightsResponse) => void,
      onError?: (error: string) => void,
      onPartialContent?: (content: string) => void
    ) => {
      setIsStreaming(true);
      setStreamStatus("Starting analysis...");

      try {
        const response = await fetch("/api/user-insights/stream-analyze", {
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
                    setStreamStatus(event.message || "");
                    onStatusUpdate?.(event.message || "");
                    break;
                  case "partial":
                    // Handle partial AI response streaming
                    onPartialContent?.(event.content || "");
                    break;
                  case "complete":
                    if (event.data) {
                      onComplete?.(event.data);
                    }
                    setIsStreaming(false);
                    return;
                  case "error":
                    const errorMessage =
                      event.message || "Unknown error occurred";
                    onError?.(errorMessage);
                    setIsStreaming(false);
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
