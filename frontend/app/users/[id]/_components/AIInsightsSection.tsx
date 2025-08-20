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
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-white font-mono tracking-wide">
            AI Performance Insights
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-4 py-2 bg-[#0a0a0a] hover:bg-white/5 border border-white/10 text-white rounded-lg font-mono text-sm tracking-wide transition-all duration-200 flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-white/60" />
            {showLogs ? "Hide Logs" : "See Logs"}
          </button>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="px-6 py-2 bg-white/10 hover:bg-white/15 border border-white/20 disabled:bg-white/5 disabled:border-white/10 text-white rounded-lg font-mono text-sm tracking-wide transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-white/60" />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Last Generated Insight */}
      {lastInsight && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white font-mono tracking-wide">
            </h4>
            <div className="flex items-center gap-2 text-sm text-white/60 font-mono">
              <Clock className="w-4 h-4" />
              <span>{formatDate(lastInsight.generatedAt)}</span>
            </div>
          </div>

          {/* Score and Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#111111] border border-white/10 rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 font-mono">
                  {lastInsight.overallScore}
                </div>
                <div className="text-sm text-white/60 font-mono tracking-wide">Overall Score</div>
              </div>
            </div>
            <div className="bg-[#111111] border border-white/10 rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 font-mono">
                  {lastInsight.performanceGrade}
                </div>
                <div className="text-sm text-white/60 font-mono tracking-wide">Performance Grade</div>
              </div>
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Issues */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 font-mono tracking-wide">
                <div className="w-5 h-5 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                </div>
                Critical Issues
              </h5>
              <ul className="space-y-2">
                {lastInsight.criticalIssues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-white/80 text-sm flex items-start gap-2 font-mono tracking-wide"
                  >
                    <span className="text-white/60 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 font-mono tracking-wide">
                <div className="w-5 h-5 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                Strengths
              </h5>
              <ul className="space-y-2">
                {lastInsight.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-white/80 text-sm flex items-start gap-2 font-mono tracking-wide"
                  >
                    <span className="text-white/60 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2">
              <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 font-mono tracking-wide">
                <div className="w-5 h-5 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                </div>
                Recommendations
              </h5>
              <ul className="space-y-2">
                {lastInsight.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-white/80 text-sm flex items-start gap-2 font-mono tracking-wide"
                  >
                    <span className="text-white/60 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="mt-6">
            <h5 className="text-lg font-semibold text-white mb-3 font-mono tracking-wide">
              Detailed Analysis
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(lastInsight.detailedAnalysis).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="bg-[#111111] border border-white/10 rounded-lg p-3"
                  >
                    <div className="text-sm font-medium text-white/60 mb-1 capitalize font-mono tracking-wide">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-sm text-white/80 font-mono">{value}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Insight Message */}
      {!lastInsight && !isGenerating && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white/60" />
          </div>
          <h4 className="text-xl font-bold text-white mb-2 font-mono tracking-wide">
            No Performance Insights
          </h4>
          <p className="text-white/60 mb-6 font-mono tracking-wide">
            Generate AI-powered performance insights to get started.
          </p>
        </div>
      )}

      {/* Insights Logs */}
      {showLogs && allInsights && allInsights.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 font-mono tracking-wide">
            Performance Insights History
          </h4>
          <div className="space-y-4">
            {allInsights.map((insight, index) => (
              <div
                key={insight.id}
                className="bg-[#111111] border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-white font-mono">
                      {insight.overallScore}
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {insight.performanceGrade}
                    </div>
                  </div>
                  <div className="text-sm text-white/60 font-mono tracking-wide">
                    {formatDate(insight.generatedAt)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-white/80 font-medium mb-1 font-mono tracking-wide">
                      Critical Issues
                    </div>
                    <div className="text-white/60 font-mono">
                      {insight.criticalIssues.length} issues
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80 font-medium mb-1 font-mono tracking-wide">
                      Strengths
                    </div>
                    <div className="text-white/60 font-mono">
                      {insight.strengths.length} strengths
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80 font-medium mb-1 font-mono tracking-wide">
                      Recommendations
                    </div>
                    <div className="text-white/60 font-mono">
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
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 mx-auto mb-4">
            <Clock className="w-6 h-6 text-white/60" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2 font-mono tracking-wide">
            No Insights History
          </h4>
          <p className="text-white/60 font-mono tracking-wide">
            Generate your first performance insight to see the history here.
          </p>
        </div>
      )}
    </div>
  );
}
