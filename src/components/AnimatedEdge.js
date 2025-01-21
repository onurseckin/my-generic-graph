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

  // Construct the path string based on edge type
  const pathD = points.reduce((path, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;

    switch (edge.type) {
      case "curved":
        // For curved type, use quadratic bezier curves
        const prevPoint = points[i - 1];
        const midX = (prevPoint[0] + x) / 2;
        const midY = (prevPoint[1] + y) / 2;
        return `${path} Q ${midX},${midY} ${x},${y}`;

      case "diagonal":
        // For diagonal type, use direct lines
        return `${path} L ${x},${y}`;

      case "orthogonal":
        // For orthogonal type, ensure right angles
        const prev = points[i - 1];
        if (prev[0] === x || prev[1] === y) {
          // If points align horizontally or vertically, direct line
          return `${path} L ${x},${y}`;
        } else {
          // Create a right angle using two line segments
          return `${path} L ${prev[0]},${y} L ${x},${y}`;
        }

      default:
        // Default to straight lines
        return `${path} L ${x},${y}`;
    }
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
