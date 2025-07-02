"use client";

import { useState, useEffect } from "react";
import { useDiagram } from "@/lib/hooks/useDiagram";
import MermaidDiagram from "@/components/MermaidDiagram";
import { Spinner } from "@/components/ui/neo/spinner";
import { getCachedDiagram, getLastGeneratedDate } from "@/app/_actions/cache";
import { Button } from "../neo/button";
import { Download, RefreshCcw } from "lucide-react";
import { Switch } from "../diagram/switch";

interface DiagramSectionProps {
  owner: string;
  repo: string;
}

export function DiagramSection({ owner, repo }: DiagramSectionProps) {
  const { diagram, loading, error, handleExportImage, handleRegenerate } =
    useDiagram(owner, repo);
  const [cachedDiagram, setCachedDiagram] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();
  const [zoomEnabled, setZoomEnabled] = useState(true);

  useEffect(() => {
    const checkCache = async () => {
      const cached = await getCachedDiagram(owner, repo);
      if (cached) {
        setCachedDiagram(cached);
        const date = await getLastGeneratedDate(owner, repo);
        setLastGenerated(date ?? undefined);
      }
    };
    void checkCache();
  }, [owner, repo]);

  const handleDownload = () => {
    if (zoomEnabled === true) {
      setZoomEnabled(false);
      setTimeout(() => {
        handleExportImage();
        setTimeout(() => {
          setZoomEnabled(true);
        }, 100);
      }, 50);
    } else {
      handleExportImage();
    }
  };

  const displayDiagram = cachedDiagram || diagram;

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-8 mb-6 text-center min-h-[120px] flex items-center justify-center">
      {loading ? (
        <Spinner>
          <div className="mt-2 text-gray-600">Generating diagram...</div>
          <div className="mt-1 text-gray-500 text-sm">
            Please allow a few seconds for the diagram of your project to
            generate.
          </div>
        </Spinner>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : displayDiagram ? (
        <div className="w-full flex flex-col items-center">
          {lastGenerated && (
            <div className="text-sm text-gray-500 p-2">
              Last generated: {lastGenerated.toLocaleString()}
            </div>
          )}
          <MermaidDiagram chart={displayDiagram} zoomingEnabled={zoomEnabled} />

          <div className="w-full flex flex-row items-center justify-center gap-6">
            <Button className="p-4" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button className="p-4" onClick={() => handleRegenerate("")}>
              <RefreshCcw className="w-4 h-4" />
              Regenerate
            </Button>
            <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm">
              <span className="text-base font-medium text-black">Zoom</span>
              <Switch checked={zoomEnabled} onCheckedChange={setZoomEnabled} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">No diagram available.</div>
      )}
    </div>
  );
}
