"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface PerformanceInsight {
  id: string;
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
  generatedBy: string;
}

interface AIInsightsSectionProps {
  userId: string;
  enterpriseId?: string;
  projectId?: string;
}

const fetchLastInsight = async (
  userId: string,
  enterpriseId?: string
): Promise<PerformanceInsight | null> => {
  const params = new URLSearchParams();
  if (enterpriseId) params.append("enterprise_id", enterpriseId);

  const response = await fetch(
    `/api/user-insights/last-insight/${userId}?${params}`
  );
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch last insight");
  }

  const data = await response.json();
  return data.insight || null;
};

const fetchAllInsights = async (
  userId: string,
  enterpriseId?: string
): Promise<PerformanceInsight[]> => {
  const params = new URLSearchParams();
  if (enterpriseId) params.append("enterprise_id", enterpriseId);

  const response = await fetch(
    `/api/user-insights/insights/${userId}?${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }

  const data = await response.json();
  return data.insights || [];
};

const generateInsights = async (
  userId: string,
  enterpriseId?: string,
  projectId?: string
) => {
  const params = new URLSearchParams();
  if (enterpriseId) params.append("enterprise_id", enterpriseId);
  if (projectId) params.append("project_id", projectId);

  const response = await fetch(`/api/user-insights/stream-analyze?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      enterpriseId,
      projectId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate insights");
  }

  return response;
};

export function AIInsightsSection({
  userId,
  enterpriseId,
  projectId,
}: AIInsightsSectionProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: lastInsight, refetch: refetchLastInsight } = useQuery({
    queryKey: ["last-insight", userId, enterpriseId],
    queryFn: () => fetchLastInsight(userId, enterpriseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allInsights, refetch: refetchAllInsights } = useQuery({
    queryKey: ["all-insights", userId, enterpriseId],
    queryFn: () => fetchAllInsights(userId, enterpriseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      console.log("Starting insight generation...");
      const response = await generateInsights(userId, enterpriseId, projectId);
      console.log("Response received:", response);

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log("Received chunk:", chunk);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("Parsed data:", data);
                if (data.type === "complete") {
                  console.log("Generation complete, refetching data...");
                  toast.success("Performance insights generated successfully!");
                  await refetchLastInsight();
                  await refetchAllInsights();
                  break;
                }
              } catch (e) {
                console.log("Parse error for line:", line, e);
                // Ignore parsing errors for partial data
              }
            }
          }
        }
      } else {
        console.log("No response body");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes("A")) return "text-green-400";
    if (grade.includes("B")) return "text-yellow-400";
    if (grade.includes("C")) return "text-orange-400";
    if (grade.includes("D") || grade.includes("F")) return "text-red-400";
    return "text-gray-400";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">
            AI Performance Insights
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showLogs ? "Hide Logs" : "See Logs"}
          </button>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Admin Only</span>
        </div>
        <p className="text-yellow-300 text-sm">
          This analysis provides brutally honest feedback for performance review
          purposes.
        </p>
      </div>

      {/* Last Generated Insight */}
      {lastInsight && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              Last Generated Insight
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatDate(lastInsight.generatedAt)}</span>
            </div>
          </div>

          {/* Score and Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getScoreColor(lastInsight.overallScore)}`}
                >
                  {lastInsight.overallScore}
                </div>
                <div className="text-sm text-gray-400">Overall Score</div>
              </div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getGradeColor(lastInsight.performanceGrade)}`}
                >
                  {lastInsight.performanceGrade}
                </div>
                <div className="text-sm text-gray-400">Performance Grade</div>
              </div>
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Issues */}
            <div>
              <h5 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Issues
              </h5>
              <ul className="space-y-2">
                {lastInsight.criticalIssues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-gray-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            <div>
              <h5 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </h5>
              <ul className="space-y-2">
                {lastInsight.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-gray-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2">
              <h5 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </h5>
              <ul className="space-y-2">
                {lastInsight.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-gray-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="mt-6">
            <h5 className="text-lg font-semibold text-white mb-3">
              Detailed Analysis
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(lastInsight.detailedAnalysis).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3"
                  >
                    <div className="text-sm font-medium text-gray-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-sm text-gray-300">{value}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Insight Message */}
      {!lastInsight && !isGenerating && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-12 text-center">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <h4 className="text-xl font-bold text-white mb-2">
            No Performance Insights
          </h4>
          <p className="text-gray-400 mb-6">
            Generate AI-powered performance insights to get started.
          </p>
        </div>
      )}

      {/* Insights Logs */}
      {showLogs && allInsights && allInsights.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Performance Insights History
          </h4>
          <div className="space-y-4">
            {allInsights.map((insight, index) => (
              <div
                key={insight.id}
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(insight.overallScore)}`}
                    >
                      {insight.overallScore}
                    </div>
                    <div
                      className={`text-xl font-bold ${getGradeColor(insight.performanceGrade)}`}
                    >
                      {insight.performanceGrade}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDate(insight.generatedAt)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-red-400 font-medium mb-1">
                      Critical Issues
                    </div>
                    <div className="text-gray-300">
                      {insight.criticalIssues.length} issues
                    </div>
                  </div>
                  <div>
                    <div className="text-green-400 font-medium mb-1">
                      Strengths
                    </div>
                    <div className="text-gray-300">
                      {insight.strengths.length} strengths
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-medium mb-1">
                      Recommendations
                    </div>
                    <div className="text-gray-300">
                      {insight.recommendations.length} recommendations
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty Logs */}
      {showLogs && (!allInsights || allInsights.length === 0) && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-semibold text-white mb-2">
            No Insights History
          </h4>
          <p className="text-gray-400">
            Generate your first performance insight to see the history here.
          </p>
        </div>
      )}
    </div>
  );
}
