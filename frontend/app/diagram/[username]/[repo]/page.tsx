"use client";

import MainCard from "../../../../components/MainCard";
import { Card } from "../../../../components/ui/card";
import { useParams } from "next/navigation";
import MermaidChart, {
  MermaidChartHandle,
} from "../../../../components/MermaidDiagram";
import { useDiagram } from "../../../../lib/hooks/useDiagram";
import { Spinner } from "../../../../components/ui/spinner";
import React from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function Repo() {
  const params = useParams<{ username: string; repo: string }>();
  const {
    diagram,
    loading,
    error,
    cost,
    state,
    handleRegenerate,
    // handleExportImage,
  } = useDiagram(params.username.toLowerCase(), params.repo.toLowerCase());
  const mermaidRef = React.useRef<MermaidChartHandle>(null);

  // Copy SVG as text
  const handleCopySVG = async () => {
    const svg = mermaidRef.current?.getSvgElement();
    if (!svg) {
      toast.error("No diagram to copy.");
      return;
    }
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      await navigator.clipboard.writeText(svgString);
      toast.success("SVG copied to clipboard!");
    } catch (e) {
      toast.error("Failed to copy SVG.");
    }
  };

  {
    /* 
    TODO: MAKE THIS WORK!! 
  // Download as PNG image using handleExportImage

  const handleDownloadPNG = () => {
    try {
      handleExportImage();
      toast.success("PNG downloaded!");
    } catch (e) {
      toast.error("Failed to download PNG.");
    }
  };
} 
*/
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-2 sm:px-0">
        <Card className="bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col items-center gap-4 w-full max-w-4xl">
          <MainCard
            username={params.username.toLowerCase()}
            repo={params.repo.toLowerCase()}
          />
          <div className="text-center text-lg font-medium">
            Your username is {params.username} and your repo is
            <a
              href={`https://github.com/${params.username}/${params.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 hover:underline transition-colors duration-150"
            >
              {params.repo}
            </a>
            <p className="text-sm text-gray-600">
              {cost ? `Cost: ${cost}` : "Cost: Calculating..."}
            </p>
          </div>

          <div className="w-full bg-gray-50 border border-gray-300 rounded p-4 my-4 text-left overflow-x-auto">
            <div className="mb-2 font-semibold">Diagram Generation State</div>
            <div className="mb-1">
              <span className="font-medium">Status:</span> {state.status}
            </div>
            <div className="mb-1">
              <span className="font-medium">Explanation:</span>
              <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {state.explanation || "(none)"}
              </pre>
            </div>
            <div className="mb-1">
              <span className="font-medium">Mapping:</span>
              <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {state.mapping || "(none)"}
              </pre>
            </div>
            <div>
              <span className="font-medium">Diagram:</span>
              <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {state.diagram || "(none)"}
              </pre>
            </div>
          </div>

          {loading && (
            <div className="w-full text-center py-4">
              <Spinner>
                <p className="mt-2 text-gray-600">Generating diagram...</p>
              </Spinner>
            </div>
          )}

          {error && (
            <div className="w-full text-center py-4 text-red-600">{error}</div>
          )}

          {!loading && !error && diagram && (
            <div className="w-full mt-4">
              <MermaidChart ref={mermaidRef} chart={diagram} />
              <div className="flex justify-center mt-4 gap-2">
                <Button onClick={handleCopySVG}>
                  <CopyIcon className="w-4 h-4" />
                  Copy as SVG
                </Button>
                <Button onClick={() => handleRegenerate("")}>
                  Regenerate Diagram
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
