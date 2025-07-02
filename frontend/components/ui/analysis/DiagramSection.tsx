"use client";

import { getCachedDiagram, getLastGeneratedDate } from "@/app/_actions/cache";
import MermaidDiagram from "@/components/MermaidDiagram";
import { Spinner } from "@/components/ui/neo/spinner";
import { useDiagram } from "@/lib/hooks/useDiagram";
import { useEffect, useState } from "react";

interface DiagramSectionProps {
  owner: string;
  repo: string;
  zoomingEnabled: boolean;
}

export function DiagramSection({ owner, repo, zoomingEnabled }: DiagramSectionProps) {
  const { diagram, loading, error, handleExportImage, handleRegenerate } =
    useDiagram(owner, repo);
  const [cachedDiagram, setCachedDiagram] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();

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
    handleExportImage();
  };

  const displayDiagram = cachedDiagram || diagram;

  return (
    <div className="w-full text-center flex flex-col items-center justify-center p-0 bg-transparent">
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
          <MermaidDiagram chart={displayDiagram} zoomingEnabled={zoomingEnabled} />
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
