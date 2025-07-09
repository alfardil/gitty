import React from "react";
import { Switch } from "./switch";

interface ReasoningEffortSelectorProps {
  reasoningEffort: "low" | "medium" | "high";
  onReasoningEffortChange: (effort: "low" | "medium" | "high") => void;
  disabled?: boolean;
}

const effortOptions = [
  { value: "low", label: "Fast", description: "Quick responses (2-5s)" },
  { value: "medium", label: "Balanced", description: "Good quality (5-15s)" },
  { value: "high", label: "Thorough", description: "Best quality (15-45s)" },
] as const;

export function ReasoningEffortSelector({
  reasoningEffort,
  onReasoningEffortChange,
  disabled = false,
}: ReasoningEffortSelectorProps) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="text-sm font-medium text-white">Reasoning Effort</div>
      <div className="flex flex-col space-y-2">
        {effortOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              reasoningEffort === option.value
                ? "bg-blue-500/20 border-blue-400/40"
                : "bg-[#23272f] border-gray-600 hover:bg-[#2a2e36]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="reasoning-effort"
              value={option.value}
              checked={reasoningEffort === option.value}
              onChange={(e) =>
                onReasoningEffortChange(
                  e.target.value as "low" | "medium" | "high"
                )
              }
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                reasoningEffort === option.value
                  ? "border-blue-400 bg-blue-400"
                  : "border-gray-400"
              }`}
            >
              {reasoningEffort === option.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {option.label}
              </div>
              <div className="text-xs text-gray-400">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
