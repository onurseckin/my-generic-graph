import React, { useRef } from "react";
import GraphEngine from "../GraphEngine";
import { DEFAULT_CONFIG } from "../utils/layoutHelper";

function GraphView({ data, zoom }) {
  const graphRef = useRef(null);

  // Merged layoutConfig using DEFAULT_CONFIG so iconUnitSize is definitely present:
  const mergedData = {
    ...data,
    layoutConfig: {
      ...DEFAULT_CONFIG,
      ...(data?.layoutConfig || {}),
    },
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div
        ref={graphRef}
        className="w-full h-full absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(-50%, -50%) scale(${zoom}) translate(50%, 50%)`,
          transformOrigin: "50% 50%",
          transition: "transform 0.2s ease-out",
          minWidth: `${DEFAULT_CONFIG.width}px`,
          minHeight: `${DEFAULT_CONFIG.height}px`,
        }}
      >
        <GraphEngine graphData={mergedData} />
      </div>
    </div>
  );
}

export default GraphView;
