import React, { useRef } from "react";
import GraphEngine from "../GraphEngine";
import { DEFAULT_CONFIG } from "../utils/layoutHelper";

function GraphView({ data, zoom }) {
  const graphRef = useRef(null);

  // Calculate minimum dimensions based on screen size
  const minWidth = Math.max(window.innerWidth, DEFAULT_CONFIG.width);
  const minHeight = Math.max(window.innerHeight, DEFAULT_CONFIG.height);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div
        ref={graphRef}
        className="w-full h-full absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(-50%, -50%) scale(${zoom}) translate(50%, 50%)`,
          transformOrigin: "50% 50%",
          transition: "transform 0.2s ease-out",
          minWidth: `${minWidth}px`,
          minHeight: `${minHeight}px`,
        }}
      >
        <GraphEngine
          graphData={{
            ...data,
            layoutConfig: {
              ...DEFAULT_CONFIG,
              ...(data?.layoutConfig || {}),
            },
          }}
        />
      </div>
    </div>
  );
}

export default GraphView;
