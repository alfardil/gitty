"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import mermaid from "mermaid";
import React from "react";

interface MermaidChartProps {
  chart: string;
  onAutoRegenerate?: () => void;
}

export interface MermaidChartHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const MermaidChart = forwardRef<MermaidChartHandle, MermaidChartProps>(
  ({ chart, onAutoRegenerate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getSvgElement: () => {
        if (!containerRef.current) return null;
        return containerRef.current.querySelector("svg");
      },
    }));

    useEffect(() => {
      setError(null);
      if (!containerRef.current) return;
      // Clear previous diagram
      containerRef.current.innerHTML = "";
      const renderMermaid = async () => {
        try {
          mermaid.parse(chart); // Validate syntax first
          const { svg } = await mermaid.render("mermaidChart", chart);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (e: any) {
          if (onAutoRegenerate) {
            // Show a toast to the user
            if (typeof window !== "undefined") {
              // Dynamically import toast to avoid SSR issues
              import("sonner").then(({ toast }) => {
                toast.error("Diagram generation failed. Retrying...");
              });
            }
            onAutoRegenerate();
          } else {
            setError(e?.message || "Invalid Mermaid diagram syntax.");
          }
        }
      };
      renderMermaid();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chart, onAutoRegenerate]);

    if (error) {
      return (
        <div className="text-red-600 bg-red-50 p-4 rounded">
          <strong>Diagram Error:</strong> {error}
          <pre className="mt-2 bg-gray-100 p-2 rounded whitespace-pre-wrap overflow-x-auto">
            {chart}
          </pre>
        </div>
      );
    }

    return <div ref={containerRef} className="w-full max-w-full p-4" />;
  }
);

export default MermaidChart;
