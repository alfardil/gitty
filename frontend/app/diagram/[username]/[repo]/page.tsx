"use client";

import MainCard from "@/components/ui/diagram/MainCard";
import { Card } from "@/components/ui/neo/card";
import { useParams } from "next/navigation";
import MermaidChart from "../../../../components/MermaidDiagram";
import { useDiagram } from "../../../../lib/hooks/useDiagram";
import { Spinner } from "@/components/ui/neo/spinner";
import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/neo/button";
import { Redo2, Download, ZoomIn } from "lucide-react";
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
    handleExportImage,
    lastGenerated,
  } = useDiagram(params.username.toLowerCase(), params.repo.toLowerCase());
  const [zoomingEnabled, setZoomingEnabled] = useState(false);

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
              {state.status === "complete" && !cost
                ? "Diagram was cached! No cost!"
                : cost
                ? `Cost: ${cost}`
                : "Cost: Calculating..."}
            </p>
          </div>

          <div className="w-full bg-gray-50 border border-gray-300 rounded p-4 my-4 text-left overflow-x-auto">
            <div className="mb-2 font-semibold">Diagram Generation State</div>
            <div className="mb-1">
              <span className="font-medium">Status:</span>{" "}
              {state.status === "complete" && !cost ? "cached" : state.status}
            </div>
            <div className="mb-1">
              <span className="font-medium">Explanation:</span>
              <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {state.explanation || "(none)"}
              </pre>
            </div>
            {state.status !== "complete" && (
              <>
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
              </>
            )}
          </div>

          {loading && state.status !== "complete" && (
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
              <MermaidChart chart={diagram} zoomingEnabled={zoomingEnabled} />
              <div className="flex justify-center mt-4 gap-2">
                <Button onClick={() => handleRegenerate("")}>
                  <Redo2 className="w-4 h-4 mr-2" />
                  Regenerate Diagram
                </Button>
                <Button onClick={handleExportImage}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PNG
                </Button>
                <Button
                  onClick={() => setZoomingEnabled(!zoomingEnabled)}
                  variant={zoomingEnabled ? "default" : "neutral"}
                >
                  <ZoomIn className="w-4 h-4 mr-2" />
                  {zoomingEnabled ? "Disable Zoom" : "Enable Zoom"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
