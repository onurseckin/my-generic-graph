import React from "react";
import { getEdgeRoute } from "../utils/boundingBox";
import { ANIMATION_SPEEDS } from "./NodeIcon"; // Import animation speeds

export default function AnimatedEdge({
  sourceNode,
  targetNode,
  allNodes,
  time = 0,
  edge,
  boxWidth,
  boxHeight,
  boxMargin,
}) {
  // Get animation speed from edge config or use default
  const speed = edge.speed || ANIMATION_SPEEDS.MEDIUM; // Use ANIMATION_SPEEDS

  // Get the routed path points
  const points = getEdgeRoute(sourceNode, targetNode, allNodes, edge);

  // Construct the path string
  const pathD = points.reduce((path, [x, y], i) => {
    if (edge.type === "curved" && i > 0) {
      // Use curved line segments
      return path + ` Q ${x},${y}`;
    }
    return path + (i === 0 ? `M ${x},${y}` : ` L ${x},${y}`);
  }, "");

  return (
    <>
      {/* Base edge with glow */}
      <path
        d={pathD}
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="8,8"
        strokeDashoffset={-time * 20 * speed}
        markerEnd="url(#arrow-white-glow)"
        filter="url(#glow)"
      />
      {/* Overlay edge with regular arrow */}
      <path
        d={pathD}
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="8,8"
        strokeDashoffset={-time * 20 * speed}
        markerEnd="url(#arrow-white)"
      />
    </>
  );
}
