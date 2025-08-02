import { useMutation } from "@tanstack/react-query";

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

export const useUserInsights = () => {
  return useMutation({
    mutationFn: async (
      request: UserInsightsRequest
    ): Promise<UserInsightsResponse> => {
      const response = await fetch("/api/user-insights/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to generate user insights");
      }

      return response.json();
    },
  });
};
