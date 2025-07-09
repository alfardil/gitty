"use client";

import Header from "@/components/Header";
import MermaidChart from "@/components/MermaidDiagram";
import { useDiagram } from "@/lib/hooks/useDiagram";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Repo() {
  const params = useParams<{ username: string; repo: string }>();
  const {
    diagram,
    loading,
    error,
    handleRegenerate,
    handleExportImage,
  } = useDiagram(params.username.toLowerCase(), params.repo.toLowerCase());
  const [zoomingEnabled, setZoomingEnabled] = useState(false);

  // Explorer drag-to-resize logic
  const [explorerHeight, setExplorerHeight] = useState(200); // px
  const dragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        // Calculate new height from window bottom
        const windowHeight = window.innerHeight;
        const newHeight = Math.max(120, Math.min(windowHeight - e.clientY - 32, 600)); // min 120, max 600
        setExplorerHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
    };
    if (dragging.current) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging.current]);

  const handleDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    document.body.style.cursor = "ns-resize";
    e.preventDefault();
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F7FAF9] w-full">
      <Header />
      <div className="w-full max-w-4xl mx-auto pt-12 px-2">
        {/* Repo Title */}
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {params.username}/{params.repo}
        </div>
        {/* Section Title with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard?section=analysis")}
            className="flex items-center gap-2 text-[#a259ff] hover:text-white hover:bg-[#a259ff] bg-[#181a20] px-4 py-2 rounded-lg shadow transition"
          >
            <span className="text-xl">←</span> Back
          </button>
          <div className="text-lg font-semibold text-gray-700">
            System Design Diagram
          </div>
        </div>
        {/* Buttons Row */}
        <div className="flex flex-row gap-3 mb-4">
          <button
            onClick={handleExportImage}
            className="flex-1 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition"
          >
            Download
          </button>
          <button
            onClick={() => handleRegenerate("")}
            className="flex-1 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition"
          >
            Regenerate
          </button>
          <button
            onClick={() => setZoomingEnabled(!zoomingEnabled)}
            className={`flex-1 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition ${zoomingEnabled ? 'ring-2 ring-blue-300' : ''}`}
          >
            {zoomingEnabled ? 'Disable Zoom' : 'Enable Zoom'}
          </button>
        </div>
        {/* Diagram Panel */}
        <div className="flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8 min-h-[400px]" style={{ aspectRatio: '1.5/1' }}>
          {loading ? (
            <div className="text-gray-500">Generating diagram...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : diagram ? (
            <MermaidChart chart={diagram} zoomingEnabled={zoomingEnabled} />
          ) : (
            <div className="text-gray-400">No diagram available.</div>
          )}
        </div>
        {/* Draggable Explorer Card */}
        <div
          className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 flex flex-col relative select-none"
          style={{ height: explorerHeight, minHeight: 120, maxHeight: 600 }}
        >
          {/* Drag handle */}
          <div
            className="w-16 h-2 rounded-full bg-gray-500 border border-gray-400 shadow"
            style={{ userSelect: "none" }}
            onMouseDown={handleDragStart}
          />
          <div className="flex-1 overflow-auto p-6">
            <div className="text-lg font-semibold text-gray-700 mb-2">Explorer</div>
            <div className="text-gray-500">(Explorer content goes here...)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
