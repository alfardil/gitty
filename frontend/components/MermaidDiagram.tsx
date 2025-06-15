"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import mermaid from "mermaid";
import { Spinner } from "@/components/ui/neo/spinner";

interface MermaidChartProps {
  chart: string;
}

export interface MermaidChartHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const MermaidChart = forwardRef<MermaidChartHandle, MermaidChartProps>(
  ({ chart }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [svg, setSvg] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getSvgElement: () => {
        if (!containerRef.current) return null;
        return containerRef.current.querySelector("svg");
      },
    }));

    useEffect(() => {
      setError(null);
      setSvg(null);
      if (!containerRef.current || !chart) return;
      mermaid
        .render("mermaidChart", chart)
        .then(({ svg }) => {
          setSvg(svg);
        })
        .catch((e) => {
          setError(e?.message || "Invalid Mermaid diagram syntax.");
        });
    }, [chart]);

    if (!chart) {
      return (
        <div className="flex items-center justify-center w-full h-40">
          <Spinner size="large" show={true} />
        </div>
      );
    }

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

    return (
      <div ref={containerRef} className="w-full max-w-full p-4">
        {svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
    );
  }
);

MermaidChart.displayName = "MermaidChart";

export default MermaidChart;
