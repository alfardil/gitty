import React from "react";
import { ProgressBar } from "@/components/ui/neo/progress-bar";
import { Spinner } from "@/components/ui/neo/spinner";
import { CheckCircle, Circle } from "lucide-react";

interface GenerationProgressProps {
  currentPhase: "explanation" | "mapping" | "diagram" | "complete";
  progress: number; // 0-100
  message?: string;
}

const phases = [
  {
    key: "explanation",
    label: "Analyzing Repository",
    description: "Understanding code structure",
  },
  {
    key: "mapping",
    label: "Creating Component Map",
    description: "Mapping files to components",
  },
  {
    key: "diagram",
    label: "Generating Diagram",
    description: "Creating Mermaid diagram",
  },
];

export function GenerationProgress({
  currentPhase,
  progress,
  message,
}: GenerationProgressProps) {
  const getPhaseIndex = (phase: string) => {
    return phases.findIndex((p) => p.key === phase);
  };

  const currentPhaseIndex = getPhaseIndex(currentPhase);
  const isComplete = currentPhase === "complete";

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-[#23272f] rounded-lg border border-blue-400/20">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Generating Diagram
        </h3>
        {message && <p className="text-sm text-gray-300">{message}</p>}
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
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-blue-400"
                        : isCompleted
                          ? "text-green-400"
                          : "text-gray-400"
                    }`}
                  >
                    {phase.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-gray-400">
                      {Math.round(progress)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{phase.description}</p>
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
          <p className="text-sm text-green-400 font-medium">
            Generation Complete!
          </p>
        </div>
      )}
    </div>
  );
}
