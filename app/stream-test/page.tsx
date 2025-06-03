"use client";

import React, { useState, useRef, useEffect } from "react";
import mermaid from "mermaid";
import { streamGenerate } from "../utils/streamGenerate";

export default function StreamTest() {
  const [diagram, setDiagram] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("streamedDiagram");
    if (saved) {
      setDiagram(saved);
      setStreamedText(saved);
    }
  }, []);

  // stream the diagram chunks
  const handleStart = async () => {
    setLoading(true);
    setDiagram("");
    setStreamedText("");
    setError("");
    localStorage.removeItem("streamedDiagram");
    let diagramBuffer = "";

    await streamGenerate(
      {
        username: "alfardil",
        repo: "paw-and-order",
        instructions: "",
      },
      (msg) => {
        // Handle streaming messages
        if (msg.error) {
          setError(msg.error);
          setLoading(false);
        }
        if (msg.status === "diagram_chunk" && msg.chunk) {
          diagramBuffer += msg.chunk;
          setDiagram(diagramBuffer);
          setStreamedText((prev) => prev + msg.chunk);
          localStorage.setItem("streamedDiagram", diagramBuffer);
        }
        if (msg.status === "complete" && msg.diagram) {
          setDiagram(msg.diagram);
          localStorage.setItem("streamedDiagram", msg.diagram);
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  // Render Mermaid diagram only when streaming is complete
  useEffect(() => {
    if (mounted && diagram && !loading && mermaidRef.current) {
      mermaidRef.current.innerHTML = "";
      mermaid
        .render("mermaid-diagram", diagram)
        .then(({ svg }) => {
          mermaidRef.current!.innerHTML = svg;
        })
        .catch((err) => {
          mermaidRef.current!.innerHTML = `<pre style="color:red;">${
            err?.message || err
          }</pre>`;
        });
    }
  }, [diagram, mounted, loading]);

  // Clear diagram and localStorage
  const handleClear = () => {
    setDiagram("");
    setStreamedText("");
    localStorage.removeItem("streamedDiagram");
    if (mermaidRef.current) mermaidRef.current.innerHTML = "";
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <button
          onClick={handleStart}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 cursor-pointer hover:bg-blue-700"
        >
          {loading ? "Streaming..." : "Start Streaming"}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-gray-800 rounded cursor-pointer hover:bg-red-600"
        >
          Clear
        </button>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Streaming Chunks</h3>
        <textarea
          value={streamedText}
          readOnly
          rows={8}
          className="w-full font-mono bg-gray-100 mb-4 p-2 rounded resize-y border border-gray-300"
        />
        <h3 className="font-semibold mb-2">Mermaid Diagram</h3>
        {/* Only render when not loading and diagram is present */}
        {mounted && !loading && diagram && (
          <div
            ref={mermaidRef}
            className="mermaid border rounded bg-white p-4"
          />
        )}
      </div>
      {error && (
        <pre className="text-red-600 mt-4 whitespace-pre-wrap">{error}</pre>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer font-medium">
          Raw Mermaid Code
        </summary>
        <pre className="bg-gray-100 p-4 max-h-96 overflow-auto rounded mt-2 whitespace-pre-wrap">
          {diagram}
        </pre>
      </details>
    </div>
  );
}
