"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import React from "react";

interface MermaidChartProps {
  chart: string;
}

const MermaidChart = ({ chart }: MermaidChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "neutral",
      htmlLabels: true,
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        nodeSpacing: 50,
        rankSpacing: 50,
        padding: 15,
      },
      themeCSS: `
        .clickable {
          transition: transform 0.2s ease;
        }
        .clickable:hover {
          transform: scale(1.05);
          cursor: pointer;
        }
        .clickable:hover > * {
          filter: brightness(0.85);
        }
      `,
    });

    mermaid.contentLoaded();
  }, [chart]);

  return (
    <div ref={containerRef} className="w-full max-w-full p-4">
      <div key={chart} className="mermaid">
        {chart}
      </div>
    </div>
  );
};

export default MermaidChart;
