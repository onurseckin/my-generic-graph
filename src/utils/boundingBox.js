import { DEFAULT_CONFIG } from "./layoutHelper";

// Cache for existing connections
let connectionCache = new Map();

// Clear cache when needed (e.g., when graph changes)
function clearRouteCache() {
  connectionCache.clear();
}

export {
  getSourcePoint,
  getTargetPoint,
  getOrthogonalRoute,
  getDiagonalRoute,
  isNeighbor,
  isNeighborInGrid,
  clearRouteCache,
};

export function getEdgeRoute(sourceNode, targetNode, allNodes, edge = {}) {
  // First check if we should use diagonal routing
  if (shouldUseDiagonalRoute(sourceNode, targetNode, allNodes, edge)) {
    return getDiagonalRoute(sourceNode, targetNode, allNodes);
  }

  // Handle explicit edge types
  switch (edge.type) {
    case "curved":
      return getCurvedRoute(sourceNode, targetNode);
    case "orthogonal":
      return getOrthogonalRoute(sourceNode, targetNode, allNodes);
    default:
      // For complex paths with potential obstacles, use obstacle avoidance
      if (allNodes.length > 2) {
        return findPathWithObstacleAvoidance(sourceNode, targetNode, allNodes);
      }
      // For simple paths, use orthogonal routing
      return getOrthogonalRoute(sourceNode, targetNode, allNodes);
  }
}

export function getNodeCorners(node) {
  const width = node.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = node.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = node.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const textMarginBottom = node.layoutConfig?.textMarginBottom || 20;
  const columnWidth =
    node.layoutConfig?.columnWidth || DEFAULT_CONFIG.columnWidth;
  const rowHeight = node.layoutConfig?.rowHeight || DEFAULT_CONFIG.rowHeight;

  // Calculate the effective space needed for the node
  const effectiveWidth = Math.max(width + 2 * margin, columnWidth * 0.4);
  const effectiveHeight = Math.max(
    height + 2 * margin + textMarginBottom,
    rowHeight * 0.4
  );

  return {
    topLeft: [node.x - effectiveWidth / 2, node.y - effectiveHeight / 2],
    bottomRight: [node.x + effectiveWidth / 2, node.y + effectiveHeight / 2],
  };
}

function getSourcePoint(sourceNode, targetNode, isDiagonal = false) {
  const width = sourceNode.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = sourceNode.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const columnWidth =
    sourceNode.layoutConfig?.columnWidth || DEFAULT_CONFIG.columnWidth;
  const rowHeight =
    sourceNode.layoutConfig?.rowHeight || DEFAULT_CONFIG.rowHeight;
  const totalMargin = margin + 10;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  if (isDiagonal) {
    return {
      point: [
        sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
        sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
      ],
      direction: `diagonal-${dx > 0 ? "right" : "left"}-${dy > 0 ? "down" : "up"}`,
    };
  }

  // Check if nodes are in grid alignment
  const isGridAligned = isNeighborInGrid(sourceNode, targetNode);

  if (isGridAligned) {
    // For nodes in the same row
    if (Math.abs(dy) < rowHeight * 0.1) {
      const direction = dx > 0 ? "right" : "left";
      return {
        point: [
          sourceNode.x +
            (direction === "right"
              ? width / 2 + totalMargin
              : -(width / 2 + totalMargin)),
          sourceNode.y,
        ],
        direction,
      };
    }
    // For nodes in the same column
    if (Math.abs(dx) < columnWidth * 0.1) {
      const direction = dy > 0 ? "down" : "up";
      return {
        point: [
          sourceNode.x,
          sourceNode.y +
            (direction === "down"
              ? height / 2 + totalMargin
              : -(height / 2 + totalMargin)),
        ],
        direction,
      };
    }
  }

  // For non-grid or custom positioned nodes, use relative positioning
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal predominant
    const direction = dx > 0 ? "right" : "left";
    return {
      point: [
        sourceNode.x +
          (direction === "right"
            ? width / 2 + totalMargin
            : -(width / 2 + totalMargin)),
        sourceNode.y,
      ],
      direction,
    };
  } else {
    // Vertical predominant
    const direction = dy > 0 ? "down" : "up";
    return {
      point: [
        sourceNode.x,
        sourceNode.y +
          (direction === "down"
            ? height / 2 + totalMargin
            : -(height / 2 + totalMargin)),
      ],
      direction,
    };
  }
}

function getTargetPoint(sourceNode, targetNode, isDiagonal = false) {
  const width = targetNode.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = targetNode.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = targetNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const totalMargin = margin + 10;
  const arrivalOffset = totalMargin + 30; // Extra space for final segment
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  if (isDiagonal) {
    return {
      point: [
        targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
        targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
      ],
      direction: `diagonal-${dx > 0 ? "left" : "right"}-${dy > 0 ? "up" : "down"}`,
    };
  }

  // For nodes in the same row/column, maintain current behavior
  if (Math.abs(dy) < 1 || Math.abs(dx) < 1) {
    if (Math.abs(dy) < 1) {
      // Same row
      const direction = dx > 0 ? "left" : "right";
      const x = targetNode.x - Math.sign(dx) * (width / 2 + totalMargin);
      return {
        point: [x, targetNode.y],
        direction: direction,
        finalSegment: [
          [x - Math.sign(dx) * arrivalOffset, targetNode.y],
          [x, targetNode.y],
        ],
      };
    } else {
      // Same column
      const direction = dy > 0 ? "up" : "down";
      const y = targetNode.y - Math.sign(dy) * (height / 2 + totalMargin);
      return {
        point: [targetNode.x, y],
        direction: direction,
        finalSegment: [
          [targetNode.x, y - Math.sign(dy) * arrivalOffset],
          [targetNode.x, y],
        ],
      };
    }
  }

  // For other connections, prioritize horizontal arrival if source is significantly to the side
  const isSignificantlyHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;

  if (isSignificantlyHorizontal) {
    const direction = dx > 0 ? "left" : "right";
    const x = targetNode.x - Math.sign(dx) * (width / 2 + totalMargin);
    return {
      point: [x, targetNode.y],
      direction: direction,
      finalSegment: [
        [x - Math.sign(dx) * arrivalOffset, targetNode.y],
        [x, targetNode.y],
      ],
    };
  } else {
    const direction = dy > 0 ? "up" : "down";
    const y = targetNode.y - Math.sign(dy) * (height / 2 + totalMargin);
    return {
      point: [targetNode.x, y],
      direction: direction,
      finalSegment: [
        [targetNode.x, y - Math.sign(dy) * arrivalOffset],
        [targetNode.x, y],
      ],
    };
  }
}

function getDiagonalRoute(sourceNode, targetNode, allNodes) {
  const sourceConnection = getSourcePoint(sourceNode, targetNode, true);
  const targetConnection = getTargetPoint(sourceNode, targetNode, true);
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  // Calculate diagonal points
  const points = [sourceConnection.point];

  // Check if direct path is clear
  const directPath = [sourceConnection.point, targetConnection.point];
  const otherNodes = allNodes.filter(
    (node) => node !== sourceNode && node !== targetNode
  );

  if (!hasIntersections(directPath, otherNodes, sourceNode, targetNode)) {
    points.push(targetConnection.point);
    return points;
  }

  // If diagonal path is blocked, create a detour
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const extraMargin = margin * 2;

  // Add midpoint for detour
  const midPoint = [
    sourceConnection.point[0] + dx * 0.5,
    sourceConnection.point[1] + dy * 0.5,
  ];

  // Offset the midpoint perpendicular to the path
  const perpDistance = extraMargin;
  const pathAngle = Math.atan2(dy, dx);
  const perpAngle = pathAngle + Math.PI / 2;

  midPoint[0] += perpDistance * Math.cos(perpAngle);
  midPoint[1] += perpDistance * Math.sin(perpAngle);

  points.push(midPoint);
  points.push(targetConnection.point);

  return points;
}

function isNeighbor(dx, dy, columnWidth, rowHeight) {
  const gridSpacing = 500; // Match the grid spacing used in isNeighborInGrid
  return (
    (Math.abs(dx) <= columnWidth && Math.abs(dy) < gridSpacing) ||
    (Math.abs(dy) <= rowHeight && Math.abs(dx) < gridSpacing)
  );
}

function isNeighborInGrid(sourceNode, targetNode) {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const columnWidth =
    sourceNode.layoutConfig?.columnWidth || DEFAULT_CONFIG.columnWidth;
  const rowHeight =
    sourceNode.layoutConfig?.rowHeight || DEFAULT_CONFIG.rowHeight;

  // For nodes in the same row
  const isHorizontalNeighbor =
    Math.abs(dy) < rowHeight * 0.1 && Math.abs(dx) <= columnWidth * 1.5;

  // For nodes in the same column
  const isVerticalNeighbor =
    Math.abs(dx) < columnWidth * 0.1 && Math.abs(dy) <= rowHeight * 1.5;

  return isHorizontalNeighbor || isVerticalNeighbor;
}

function getOrthogonalRoute(sourceNode, targetNode, allNodes) {
  // Get layout configuration with fallbacks
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const boxWidth = sourceNode.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const boxHeight =
    sourceNode.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const columnWidth =
    sourceNode.layoutConfig?.columnWidth || DEFAULT_CONFIG.columnWidth;
  const rowHeight =
    sourceNode.layoutConfig?.rowHeight || DEFAULT_CONFIG.rowHeight;

  // For neighbors, use direct connection
  if (isNeighborInGrid(sourceNode, targetNode)) {
    const sourceConnection = getSourcePoint(sourceNode, targetNode);
    const targetConnection = getTargetPoint(sourceNode, targetNode);
    return [sourceConnection.point, targetConnection.point];
  }

  // Create cache key for this node pair
  const cacheKey = `${sourceNode.id}-${targetNode.id}`;
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey);
  }

  // Pre-calculate node boxes with border barriers
  const nodeBoxes = new Map();
  allNodes.forEach((node) => {
    if (node !== sourceNode && node !== targetNode) {
      const corners = getNodeCorners(node);
      const width = node.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
      const height = node.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
      const nodeMargin =
        node.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
      const borderSpace = Math.max(
        nodeMargin * 2,
        Math.min(columnWidth, rowHeight) * 0.15
      );

      nodeBoxes.set(node.id, {
        topLeft: [
          corners.topLeft[0] - borderSpace,
          corners.topLeft[1] - borderSpace,
        ],
        bottomRight: [
          corners.bottomRight[0] + borderSpace,
          corners.bottomRight[1] + borderSpace,
        ],
      });
    }
  });

  // Get primary connection points
  const sourceConnection = getSourcePoint(sourceNode, targetNode);
  const targetConnection = getTargetPoint(sourceNode, targetNode);

  // Try direct path first
  const directPath = [
    sourceConnection.point,
    ...(targetConnection.finalSegment || [targetConnection.point]),
  ];

  if (!hasIntersections(directPath, allNodes, sourceNode, targetNode)) {
    connectionCache.set(cacheKey, directPath);
    return directPath;
  }

  // If direct path fails, try alternative connection points
  const sourcePoints = [sourceConnection];
  const targetPoints = [
    targetConnection,
    getTargetPoint({ ...sourceNode, x: targetNode.x + boxWidth }, targetNode), // Force left entry
    getTargetPoint({ ...sourceNode, x: targetNode.x - boxWidth }, targetNode), // Force right entry
    getTargetPoint({ ...sourceNode, y: targetNode.y - boxHeight }, targetNode), // Force down entry
    getTargetPoint({ ...sourceNode, y: targetNode.y + boxHeight }, targetNode), // Force up entry
  ];

  let bestPath = null;
  let bestScore = Infinity;

  // Try each combination of source and target points
  for (const source of sourcePoints) {
    for (const target of targetPoints) {
      // Skip if this target point is already used by another connection
      const existingPaths = Array.from(connectionCache.values());
      const isTargetUsed = existingPaths.some((path) => {
        const existingTarget = path[path.length - 1];
        const dx = existingTarget[0] - target.point[0];
        const dy = existingTarget[1] - target.point[1];
        return Math.abs(dx) < 20 && Math.abs(dy) < 20;
      });

      if (isTargetUsed) {
        continue;
      }

      // Generate Manhattan-style paths
      const paths = generateOrthogonalPaths(source, target, margin);

      for (const path of paths) {
        // Add final segment if available
        const fullPath = target.finalSegment
          ? [...path.slice(0, -1), ...target.finalSegment]
          : path;

        // Check for intersections with nodes
        if (hasIntersections(fullPath, allNodes, sourceNode, targetNode)) {
          continue;
        }

        const score = evaluatePath(fullPath, nodeBoxes);
        if (score < bestScore) {
          bestScore = score;
          bestPath = fullPath;
        }
      }
    }
  }

  // Use the best path found or fallback to direct connection
  const finalPath = bestPath || directPath;
  connectionCache.set(cacheKey, finalPath);
  return finalPath;
}

// Helper function to generate orthogonal paths between points
function generateOrthogonalPaths(source, target, margin) {
  const [sx, sy] = source.point;
  const [tx, ty] = target.point;
  const paths = [];

  // Helper to create path with proper spacing
  function createPath(points) {
    return points.filter((p, i, arr) => {
      if (i === 0 || i === arr.length - 1) return true;
      const prev = arr[i - 1];
      const next = arr[i + 1];
      return !(prev[0] === next[0] && prev[1] === next[1]);
    });
  }

  // Path 1: Horizontal then Vertical
  paths.push(createPath([source.point, [tx, sy], target.point]));

  // Path 2: Vertical then Horizontal
  paths.push(createPath([source.point, [sx, ty], target.point]));

  // Path 3: Using midpoint for more natural flow
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  if (source.direction === "right" || source.direction === "left") {
    paths.push(
      createPath([source.point, [midX, sy], [midX, ty], target.point])
    );
  } else {
    paths.push(
      createPath([source.point, [sx, midY], [tx, midY], target.point])
    );
  }

  return paths;
}

// Function to evaluate path quality
function evaluatePath(path, nodeBoxes) {
  // Calculate base score from path length (shortest path preferred)
  let score = 0;
  for (let i = 0; i < path.length - 1; i++) {
    score +=
      Math.abs(path[i + 1][0] - path[i][0]) +
      Math.abs(path[i + 1][1] - path[i][1]);
  }

  // Check for self-intersections (TOP Priority)
  for (let i = 0; i < path.length - 2; i++) {
    for (let j = i + 2; j < path.length - 1; j++) {
      if (
        linesIntersect(
          path[i][0],
          path[i][1],
          path[i + 1][0],
          path[i + 1][1],
          path[j][0],
          path[j][1],
          path[j + 1][0],
          path[j + 1][1]
        )
      ) {
        return Infinity;
      }
    }
  }

  // Check for node intersections (Second Priority)
  for (let i = 0; i < path.length - 1; i++) {
    if (
      segmentIntersectsNodes(
        path[i][0],
        path[i][1],
        path[i + 1][0],
        path[i + 1][1],
        nodeBoxes
      )
    ) {
      return Infinity;
    }
  }

  // Check for existing connections at the target point (Third Priority)
  const targetPoint = path[path.length - 1];
  const existingPaths = Array.from(connectionCache.values());
  const arrivalThreshold = 20; // Threshold for considering points as overlapping

  for (const existingPath of existingPaths) {
    const existingTarget = existingPath[existingPath.length - 1];
    const dx = existingTarget[0] - targetPoint[0];
    const dy = existingTarget[1] - targetPoint[1];
    if (Math.abs(dx) < arrivalThreshold && Math.abs(dy) < arrivalThreshold) {
      score += 1000; // Significant penalty for overlapping arrival points
      break;
    }
  }

  return score;
}

function getCurvedRoute(sourceNode, targetNode) {
  const sourceConnection = getSourcePoint(sourceNode, targetNode);
  const targetConnection = getTargetPoint(sourceNode, targetNode);
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const extraMargin = margin * 2;

  // Calculate control points that respect departure and arrival directions
  const points = [sourceConnection.point];

  // First control point follows source direction
  const cp1Distance = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + extraMargin;
  let cp1;
  switch (sourceConnection.direction) {
    case "right":
      cp1 = [
        sourceConnection.point[0] + cp1Distance,
        sourceConnection.point[1],
      ];
      break;
    case "left":
      cp1 = [
        sourceConnection.point[0] - cp1Distance,
        sourceConnection.point[1],
      ];
      break;
    case "up":
      cp1 = [
        sourceConnection.point[0],
        sourceConnection.point[1] - cp1Distance,
      ];
      break;
    case "down":
      cp1 = [
        sourceConnection.point[0],
        sourceConnection.point[1] + cp1Distance,
      ];
      break;
    default:
      cp1 = sourceConnection.point;
  }

  // Second control point leads into target direction
  const cp2Distance = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + extraMargin;
  let cp2;
  switch (targetConnection.direction) {
    case "left":
      cp2 = [
        targetConnection.point[0] - cp2Distance,
        targetConnection.point[1],
      ];
      break;
    case "right":
      cp2 = [
        targetConnection.point[0] + cp2Distance,
        targetConnection.point[1],
      ];
      break;
    case "up":
      cp2 = [
        targetConnection.point[0],
        targetConnection.point[1] - cp2Distance,
      ];
      break;
    case "down":
      cp2 = [
        targetConnection.point[0],
        targetConnection.point[1] + cp2Distance,
      ];
      break;
    default:
      cp2 = targetConnection.point;
  }

  return [sourceConnection.point, cp1, cp2, targetConnection.point];
}

function shouldUseDiagonalRoute(sourceNode, targetNode, allNodes, edge) {
  // Respect explicit edge types
  if (edge.type === "diagonal") return true;
  if (edge.type === "orthogonal") return false;

  // Always use orthogonal for neighbors
  if (isNeighborInGrid(sourceNode, targetNode)) return false;

  // For non-neighbors, check if diagonal path is clear
  const sourcePoint = getSourcePoint(sourceNode, targetNode, true).point;
  const targetPoint = getTargetPoint(sourceNode, targetNode, true).point;

  const directPath = [sourcePoint, targetPoint];
  return !hasIntersections(directPath, allNodes, sourceNode, targetNode);
}

function lineIntersectsBox(x1, y1, x2, y2, left, top, right, bottom) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  if (maxX < left || minX > right || maxY < top || minY > bottom) {
    return false;
  }

  if (x1 === x2) {
    return (
      x1 >= left &&
      x1 <= right &&
      Math.max(y1, y2) >= top &&
      Math.min(y1, y2) <= bottom
    );
  }

  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;

  const leftY = m * left + b;
  const rightY = m * right + b;
  const topX = (top - b) / m;
  const bottomX = (bottom - b) / m;

  return (
    (leftY >= top && leftY <= bottom) ||
    (rightY >= top && rightY <= bottom) ||
    (topX >= left && topX <= right) ||
    (bottomX >= left && bottomX <= right)
  );
}

function hasIntersections(path, allNodes, sourceNode, targetNode) {
  // Skip source and target nodes when checking intersections
  const otherNodes = allNodes.filter(
    (node) => node !== sourceNode && node !== targetNode
  );

  // Check each line segment against each node's bounding box
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];

    for (const node of otherNodes) {
      const { topLeft, bottomRight } = getNodeCorners(node);
      if (
        lineIntersectsBox(
          x1,
          y1,
          x2,
          y2,
          topLeft[0],
          topLeft[1],
          bottomRight[0],
          bottomRight[1]
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

// Core node space calculations
function getNodeSpace(node) {
  const width = node.layoutConfig?.boxWidth || 100;
  const height = node.layoutConfig?.boxHeight || 140;
  const margin = node.layoutConfig?.boxMargin || 15;
  const safetyMargin = margin + 10;

  return {
    width,
    height,
    margin,
    safetyMargin,
    totalWidth: width + 2 * safetyMargin,
    totalHeight: height + 2 * safetyMargin,
    corners: {
      topLeft: [
        node.x - width / 2 - safetyMargin,
        node.y - height / 2 - safetyMargin,
      ],
      bottomRight: [
        node.x + width / 2 + safetyMargin,
        node.y + height / 2 + safetyMargin,
      ],
    },
  };
}

function getConnectionPoints(node) {
  const space = getNodeSpace(node);
  const halfWidth = space.width / 2;
  const halfHeight = space.height / 2;

  return {
    top: {
      point: [node.x, node.y - halfHeight - space.margin],
      direction: "down",
    },
    bottom: {
      point: [node.x, node.y + halfHeight + space.margin],
      direction: "up",
    },
    left: {
      point: [node.x - halfWidth - space.margin, node.y],
      direction: "right",
    },
    right: {
      point: [node.x + halfWidth + space.margin, node.y],
      direction: "left",
    },
  };
}

function determineOptimalConnectionPoints(sourceNode, targetNode) {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const sourcePoints = getConnectionPoints(sourceNode);
  const targetPoints = getConnectionPoints(targetNode);

  // Determine best connection points based on relative positions
  let sourceConnection, targetConnection;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal predominant
    if (dx > 0) {
      sourceConnection = sourcePoints.right;
      targetConnection = targetPoints.left;
    } else {
      sourceConnection = sourcePoints.left;
      targetConnection = targetPoints.right;
    }
  } else {
    // Vertical predominant
    if (dy > 0) {
      sourceConnection = sourcePoints.bottom;
      targetConnection = targetPoints.top;
    } else {
      sourceConnection = sourcePoints.top;
      targetConnection = targetPoints.bottom;
    }
  }

  return {
    source: sourceConnection,
    target: targetConnection,
  };
}

function findPathWithObstacleAvoidance(sourceNode, targetNode, allNodes) {
  const { source, target } = determineOptimalConnectionPoints(
    sourceNode,
    targetNode
  );
  const otherNodes = allNodes.filter(
    (node) => node !== sourceNode && node !== targetNode
  );

  // Try direct path first
  const directPath = [source.point, target.point];
  if (!hasIntersections(directPath, otherNodes, sourceNode, targetNode)) {
    return directPath;
  }

  // Initialize A* pathfinding
  const openSet = new Set([JSON.stringify(source.point)]);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(JSON.stringify(source.point), 0);
  fScore.set(
    JSON.stringify(source.point),
    manhattanDistance(source.point, target.point)
  );

  while (openSet.size > 0) {
    const current = getLowestFScore(
      Array.from(openSet).map((p) => JSON.parse(p)),
      fScore
    );
    const currentStr = JSON.stringify(current);

    if (isAtTarget(current, target.point)) {
      return reconstructPath(cameFrom, current, source.point);
    }

    openSet.delete(currentStr);

    for (const neighbor of generateValidNeighbors(
      current,
      target.point,
      otherNodes
    )) {
      const neighborStr = JSON.stringify(neighbor);
      const tentativeGScore =
        gScore.get(currentStr) + distance(current, neighbor);

      if (
        !gScore.has(neighborStr) ||
        tentativeGScore < gScore.get(neighborStr)
      ) {
        cameFrom.set(neighborStr, current);
        gScore.set(neighborStr, tentativeGScore);
        fScore.set(
          neighborStr,
          tentativeGScore + manhattanDistance(neighbor, target.point)
        );

        if (!openSet.has(neighborStr)) {
          openSet.add(neighborStr);
        }
      }
    }
  }

  // Fallback to manhattan route if no path found
  return generateManhattanRoute(source, target);
}

// Helper functions
function manhattanDistance(point1, point2) {
  return Math.abs(point2[0] - point1[0]) + Math.abs(point2[1] - point1[1]);
}

function distance(point1, point2) {
  return Math.sqrt(
    Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2)
  );
}

function isAtTarget(current, target) {
  return distance(current, target) < 1;
}

function getLowestFScore(points, fScore) {
  return points.reduce((min, point) => {
    const score = fScore.get(JSON.stringify(point)) || Infinity;
    const minScore = fScore.get(JSON.stringify(min)) || Infinity;
    return score < minScore ? point : min;
  });
}

function generateValidNeighbors(point, target, obstacles) {
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  return directions
    .map(([dx, dy]) => [point[0] + dx * 20, point[1] + dy * 20])
    .filter((newPoint) => !intersectsAnyNode(point, newPoint, obstacles));
}

function intersectsAnyNode(start, end, nodes) {
  return nodes.some((node) => {
    const space = getNodeSpace(node);
    return lineIntersectsBox(
      start[0],
      start[1],
      end[0],
      end[1],
      space.corners.topLeft[0],
      space.corners.topLeft[1],
      space.corners.bottomRight[0],
      space.corners.bottomRight[1]
    );
  });
}

function reconstructPath(cameFrom, current, start) {
  const path = [current];
  let currentStr = JSON.stringify(current);

  while (cameFrom.has(currentStr)) {
    current = cameFrom.get(currentStr);
    currentStr = JSON.stringify(current);
    path.unshift(current);
  }

  return smoothPath(path);
}

function smoothPath(path) {
  if (path.length <= 2) return path;

  const smoothed = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    let furthest = current + 1;

    for (let i = current + 2; i < path.length; i++) {
      const directPath = [path[current], path[i]];
      if (!hasIntersections(directPath, [], null, null)) {
        furthest = i;
      }
    }

    smoothed.push(path[furthest]);
    current = furthest;
  }

  return smoothed;
}

function generateManhattanRoute(source, target) {
  const [sx, sy] = source.point;
  const [tx, ty] = target.point;

  // Ensure proper entry/exit directions
  const points = [source.point];

  if (source.direction === "right" || source.direction === "left") {
    points.push([tx, sy]);
  } else {
    points.push([sx, ty]);
  }

  points.push(target.point);
  return points;
}

// Function to check if a path segment intersects with any node's border space
function segmentIntersectsNodes(x1, y1, x2, y2, nodeBoxes) {
  for (const [nodeId, box] of nodeBoxes) {
    if (
      lineIntersectsBox(
        x1,
        y1,
        x2,
        y2,
        box.topLeft[0],
        box.topLeft[1],
        box.bottomRight[0],
        box.bottomRight[1]
      )
    ) {
      return true;
    }
  }
  return false;
}

// Helper function to check if two line segments intersect
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Calculate denominators for intersection check
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false; // Lines are parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Check if intersection point lies within both line segments
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}
