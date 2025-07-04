"use client";

import mermaid from "mermaid";
import { useEffect, useRef } from "react";
// Remove the direct import
// import svgPanZoom from "svg-pan-zoom";

interface MermaidChartProps {
  chart: string;
  zoomingEnabled?: boolean;
}

const MermaidChart = ({ chart, zoomingEnabled = true }: MermaidChartProps) => {
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

    const initializePanZoom = async () => {
      const svgElement = containerRef.current?.querySelector("svg");
      if (svgElement) {
        if (zoomingEnabled) {
          // Remove any max-width constraints for zoom mode
          svgElement.style.maxWidth = "none";
          svgElement.style.width = "100%";
          svgElement.style.height = "100%";

          try {
            // Dynamically import svg-pan-zoom only when needed in the browser
            const svgPanZoom = (await import("svg-pan-zoom")).default;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            svgPanZoom(svgElement, {
              zoomEnabled: true,
              controlIconsEnabled: true,
              fit: true,
              center: true,
              minZoom: 0.1,
              maxZoom: 10,
              zoomScaleSensitivity: 0.3,
            });
          } catch (error) {
            console.error("Failed to load svg-pan-zoom:", error);
          }
        } else {
          // Auto-fit mode: make SVG fit within container
          svgElement.style.maxWidth = "100%";
          svgElement.style.width = "100%";
          svgElement.style.height = "100%";
          svgElement.style.objectFit = "contain";
        }
      }
    };

    mermaid.contentLoaded();
    // Wait for the SVG to be rendered
    setTimeout(() => {
      void initializePanZoom();
    }, 100);

    return () => {
      // Cleanup not needed with dynamic import approach
    };
  }, [chart, zoomingEnabled]); // Added zoomingEnabled to dependencies

  return (
    <div ref={containerRef} className="w-full max-w-full flex justify-center">
      <div
        key={`${chart}-${zoomingEnabled}`}
        className="mermaid w-full h-[600px] rounded-lg border-2 border-black flex items-center justify-center overflow-hidden"
        style={{ background: "white" }}
      >
        {chart}
      </div>
    </div>
  );
};

export default MermaidChart;
