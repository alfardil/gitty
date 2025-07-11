"use client";

import MermaidDiagram from "@/app/[owner]/_components/MermaidDiagram";
import { useDiagram } from "@/lib/hooks/useDiagram";
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
    <div className="w-full text-center flex flex-col items-center justify-center p-0 bg-transparent">
      {/* controls */}
      <div className="flex flex-row gap-3 mb-8 justify-center items-center">
        <button
          onClick={handleDownload}
          className="bg-[#23272f] rounded-lg py-2 px-4 text-white font-medium hover:bg-blue-700 transition border border-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Download
        </button>
        <button
          onClick={() => handleRegenerate("")}
          className="bg-[#23272f] rounded-lg py-2 px-4 text-white font-medium hover:bg-blue-700 transition border border-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Regenerate
        </button>
        <div className="flex items-center gap-2 bg-[#23272f] rounded-lg py-2 px-4">
          <span className="text-white font-medium">Zoom</span>
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
