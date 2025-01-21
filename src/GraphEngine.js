import React, { useEffect, useRef, useMemo } from "react";
import NodeIcon from "./components/NodeIcon";
import AnimatedEdge from "./components/AnimatedEdge";
import { arrangeInGrid } from "./utils/layoutHelper";

export default function GraphEngine({ graphData }) {
  // Add render counter to track re-renders
  const renderCount = useRef(0);
  renderCount.current++;

  // Pass the entire graphData object to arrangeInGrid
  const { nodes, config } = useMemo(
    () => arrangeInGrid(graphData),
    [graphData]
  );

  // Use refs for animation values instead of state
  const timeRef = useRef(0);
  const dashOffsetRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const animationFrame = (currentTime) => {
      if (currentTime - lastTime >= 16) {
        frameCountRef.current++;
        lastTime = currentTime;
        timeRef.current += 0.016;
        dashOffsetRef.current = (dashOffsetRef.current - 0.5) % 20;

        const edges = document.querySelectorAll("path");
        edges.forEach((edge) => {
          edge.style.strokeDashoffset = -timeRef.current * 20 * 4;
        });
      }
      frameId = requestAnimationFrame(animationFrame);
    };

    frameId = requestAnimationFrame(animationFrame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Render edges using graphData.edges
  const edgeElems = graphData?.edges?.map((edge, i) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    // Calculate actual box dimensions from config
    const actualBoxWidth = config.boxWidth + 2 * config.boxMargin;
    const actualBoxHeight = config.boxHeight + 2 * config.boxMargin;

    return (
      <AnimatedEdge
        key={i}
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        allNodes={nodes}
        time={timeRef.current}
        boxWidth={actualBoxWidth}
        boxHeight={actualBoxHeight}
        boxMargin={config.boxMargin}
      />
    );
  });

  // Render nodes
  const nodeElems = nodes.map((node) => {
    const { id, x, y, name } = node;
    // Merge node config
    const nodeConfig = {
      ...config,
      ...(node.layoutConfig || {}),
    };

    return (
      <g key={id} transform={`translate(${x},${y})`}>
        {/* Node shapes and animations */}
        <NodeIcon node={node} time={timeRef.current} config={nodeConfig} />
        {/* Label */}
        <text
          x="0"
          y={nodeConfig.textMarginTop}
          textAnchor="middle"
          fill="white"
          fontSize={nodeConfig.fontSize}
          fontFamily="Arial"
        >
          {name}
        </text>
      </g>
    );
  });

  return (
    <svg
      className="w-full h-full bg-black"
      viewBox={`0 0 ${config.width} ${config.height}`}
    >
      <defs>
        {/* Regular white arrow marker */}
        <marker
          id="arrow-white"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,2 L0,8 L8,5 z" fill="white" />
        </marker>

        {/* Glowing white arrow marker */}
        <marker
          id="arrow-white-glow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,2 L0,8 L8,5 z" fill="white" />
        </marker>

        {/* Glow filter for lines */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Special glow filter for arrow heads */}
        <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="edges">{edgeElems}</g>
      <g className="nodes">{nodeElems}</g>
    </svg>
  );
}
