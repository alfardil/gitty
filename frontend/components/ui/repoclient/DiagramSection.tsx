"use client";

import { useState, useEffect } from "react";
import { useDiagram } from "@/lib/hooks/useDiagram";
import MermaidDiagram from "@/components/MermaidDiagram";
import { Spinner } from "@/components/ui/neo/spinner";
import { getCachedDiagram, getLastGeneratedDate } from "@/app/_actions/cache";

interface DiagramSectionProps {
  owner: string;
  repo: string;
}

export function DiagramSection({ owner, repo }: DiagramSectionProps) {
  const { diagram, loading, error, state } = useDiagram(owner, repo);
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

  const isComplete = state?.status === "complete" && !!diagram;
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
          <MermaidDiagram chart={displayDiagram} />
          {lastGenerated && (
            <div className="text-sm text-gray-500 mt-2">
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
