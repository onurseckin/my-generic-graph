import { useRef } from "react";
import GraphEngine from "../GraphEngine";

function GraphView({ data, zoom, onZoomIn, onZoomOut, onZoomReset }) {
  const graphRef = useRef(null);
  const containerRef = useRef(null);

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY > 0) {
        onZoomOut();
      } else {
        onZoomIn();
      }
    }
  };

  return (
    <div ref={containerRef} className="graph-container" onWheel={handleWheel}>
      <div
        ref={graphRef}
        className="graph-content"
        style={{ transform: `scale(${zoom})` }}
      >
        <GraphEngine graphData={data} />
      </div>
    </div>
  );
}

export default GraphView;
