"use client";

import MermaidDiagram from "@/app/[owner]/_components/MermaidDiagram";
import { useDiagram } from "@/lib/hooks/business/useDiagram";
import { useState } from "react";
import { Switch } from "../../../components/ui/diagram/switch";
import { GenerationProgress } from "@/components/ui/diagram/GenerationProgress";

interface DiagramSectionProps {
  owner: string;
  repo: string;
}

export function DiagramSection({ owner, repo }: DiagramSectionProps) {
  const {
    diagram,
    loading,
    error,
    handleExportImage,
    handleRegenerate,
    lastGenerated,
    progress,
    currentPhase,
    state,
  } = useDiagram(owner, repo);

  const [zoomingEnabled, setZoomingEnabled] = useState(false);

  const handleDownload = () => {
    if (zoomingEnabled) {
      setTimeout(() => {
        setZoomingEnabled(false);
        setTimeout(() => {
          handleExportImage();
          setZoomingEnabled(true);
        }, 100);
      }, 100);
    } else {
      handleExportImage();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-0 bg-transparent">
      {/* Controls - Right Aligned - Only show when diagram exists or is loading */}
      {(diagram || loading) && (
        <div className="flex items-center gap-2 mb-4 justify-end w-full">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all duration-200 text-xs font-mono"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download
          </button>

          <button
            onClick={() => handleRegenerate("")}
            className="px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all duration-200 text-xs font-mono"
          >
            Regenerate
          </button>

          <button
            onClick={() => setZoomingEnabled(!zoomingEnabled)}
            className={`px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg transition-all duration-200 text-xs font-mono ${
              zoomingEnabled
                ? "text-white border-white/20"
                : "text-white/70 hover:text-white hover:border-white/20"
            }`}
          >
            Zoom
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="w-full max-w-lg bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10 w-full">
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-mono text-white font-semibold tracking-wide mb-1">
                Generating Diagram
              </h3>
              <p className="text-white/60 text-xs font-mono">
                Analyzing system architecture...
              </p>
            </div>

            {/* Current Step */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex-1">
                <div className="text-blue-400 font-mono text-sm font-medium">
                  {currentPhase}
                </div>
                <div className="text-white/60 text-xs font-mono">
                  {currentPhase === "explanation" && "Processing..."}
                  {currentPhase === "mapping" && "Analyzing..."}
                  {currentPhase === "diagram" && "Generating..."}
                  {currentPhase === "validation" && "Validating..."}
                </div>
              </div>
              <div className="text-blue-400 font-mono text-xs">
                {progress || 0}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono tracking-wide">
          {error}
        </div>
      ) : diagram && state.status === "complete" ? (
        <div className="w-full flex flex-col items-center">
          {/* Diagram Container */}
          <div className="w-full bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-xl p-1 relative overflow-hidden group">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-60 rounded-xl"></div>
            <div className="relative z-10 bg-white rounded-lg">
              <MermaidDiagram chart={diagram} zoomingEnabled={zoomingEnabled} />
            </div>
          </div>

          {/* Last Generated Timestamp */}
          {lastGenerated && (
            <div className="text-xs text-white/40 pt-6 text-center font-mono tracking-wider">
              Last generated: {lastGenerated.toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-xl p-8 text-center">
          <div className="text-white/40 font-mono tracking-wide mb-4">
            No diagram generated yet.
          </div>
          <button
            onClick={() => handleRegenerate("")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-mono text-sm"
          >
            Generate Diagram
          </button>
        </div>
      )}
    </div>
  );
}
