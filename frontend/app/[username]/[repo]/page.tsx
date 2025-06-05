"use client";

import MainCard from "../../../components/MainCard";
import { Card } from "../../../components/ui/card";
import { useParams } from "next/navigation";
import MermaidChart from "../../../components/Mermaid-Diagram";
import { useDiagram } from "../../../lib/hooks/useDiagram";
import { Spinner } from "../../../components/ui/spinner";
import React from "react";

export default function Repo() {
  const params = useParams<{ username: string; repo: string }>();
  const { diagram, loading, error, cost, state } = useDiagram(
    params.username.toLowerCase(),
    params.repo.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
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

        {/* State Debug Info */}
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
            <MermaidChart chart={diagram} />
          </div>
        )}
      </Card>
    </div>
  );
}
