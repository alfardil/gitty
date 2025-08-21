import React from "react";
import { ProgressBar } from "@/components/ui/neo/progress-bar";
import { Spinner } from "@/components/ui/neo/spinner";
import { CheckCircle, Circle } from "lucide-react";

interface ReadmeGenerationProgressProps {
  currentPhase: "fetching" | "analyzing" | "generating" | "complete";
  progress: number; // 0-100
  message?: string;
}

const phases = [
  {
    key: "fetching",
    label: "Fetching Files",
    description: "Retrieving repository files",
  },
  {
    key: "analyzing",
    label: "Analyzing Content",
    description: "Understanding project structure",
  },
  {
    key: "generating",
    label: "Generating README",
    description: "Creating documentation",
  },
];

export function ReadmeGenerationProgress({
  currentPhase,
  progress,
  message,
}: ReadmeGenerationProgressProps) {
  const getPhaseIndex = (phase: string) => {
    return phases.findIndex((p) => p.key === phase);
  };

  const currentPhaseIndex = getPhaseIndex(currentPhase);
  const isComplete = currentPhase === "complete";

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-[#0a0a0a] rounded-lg border border-white/10">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2 font-mono tracking-wide">
          Generating README
        </h3>
        {message && (
          <p className="text-sm text-white/60 font-mono">{message}</p>
        )}
      </div>

      {/* Phase indicators */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const isActive = currentPhase === phase.key;
          const isCompleted = currentPhaseIndex > index || isComplete;
          const isPending = currentPhaseIndex < index;

          return (
            <div key={phase.key} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : isActive ? (
                  <Spinner size="small" />
                ) : (
                  <Circle className="w-5 h-5 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium font-mono ${
                      isActive
                        ? "text-blue-400"
                        : isCompleted
                          ? "text-green-400"
                          : "text-white/60"
                    }`}
                  >
                    {phase.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-white/60 font-mono">
                      {Math.round(progress)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 font-mono">
                  {phase.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      {!isComplete && (
        <div className="pt-4">
          <ProgressBar
            progress={progress}
            variant="blue"
            size="medium"
            showPercentage={false}
          />
        </div>
      )}

      {isComplete && (
        <div className="text-center pt-4">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-green-400 font-medium font-mono tracking-wide">
            README Generated!
          </p>
        </div>
      )}
    </div>
  );
}
