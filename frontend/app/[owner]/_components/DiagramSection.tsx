"use client";

import MermaidDiagram from "@/app/[owner]/_components/MermaidDiagram";
import { GenerationProgress } from "@/components/ui/diagram/GenerationProgress";
import { useDiagram } from "@/lib/hooks/useDiagram";
import { useState } from "react";
import { Switch } from "../../../components/ui/diagram/switch";

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
    <div className="w-full text-center flex flex-col items-center justify-center p-0 bg-transparent">
      {/* controls */}
      <div className="flex flex-row gap-3 mb-8 justify-center items-center">
        <button
          onClick={handleDownload}
          className="bg-black/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20 shadow-[0_4px_24px_rgba(110,31,255,0.18)] hover:shadow-[0_8px_32px_rgba(110,31,255,0.25)] text-purple-200 hover:text-white px-5 py-2 rounded-full font-semibold text-base transition-all duration-200 group"
        >
          Download
        </button>
        <button
          onClick={() => handleRegenerate("")}
          className="bg-black/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20 shadow-[0_4px_24px_rgba(110,31,255,0.18)] hover:shadow-[0_8px_32px_rgba(110,31,255,0.25)] text-purple-200 hover:text-white px-5 py-2 rounded-full font-semibold text-base transition-all duration-200 group"
        >
          Regenerate
        </button>
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20 shadow-[0_4px_24px_rgba(110,31,255,0.18)] hover:shadow-[0_8px_32px_rgba(110,31,255,0.25)] text-purple-200 px-5 py-2 rounded-full font-semibold text-base transition-all duration-200 group">
          <span className="text-purple-200 font-medium">Zoom</span>
          <Switch
            checked={zoomingEnabled}
            onCheckedChange={setZoomingEnabled}
          />
        </div>
      </div>

      {/* show the diagram */}
      {loading ? (
        <div className="w-full flex flex-col items-center">
          <GenerationProgress
            currentPhase={currentPhase}
            progress={progress}
            message={state.message}
          />
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : diagram && state.status === "complete" ? (
        <div className="w-full flex flex-col items-center">
          <MermaidDiagram chart={diagram} zoomingEnabled={zoomingEnabled} />
          {lastGenerated && (
            <div className="text-sm text-gray-500 pt-4 text-center">
              Last generated: {lastGenerated.toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400">No diagram available.</div>
      )}
    </div>
  );
}
