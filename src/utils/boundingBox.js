import { DEFAULT_CONFIG } from "./layoutHelper";

export {
  getSourcePoint,
  getTargetPoint,
  getOrthogonalRoute,
  getDiagonalRoute,
  isNeighbor,
  isNeighborInGrid,
};

export function getEdgeRoute(sourceNode, targetNode, allNodes) {
  // Check if nodes are immediate neighbors
  if (isNeighborInGrid(sourceNode, targetNode)) {
    return getOrthogonalRoute(sourceNode, targetNode, allNodes);
  }

  // Try diagonal first, fall back to orthogonal if needed
  return getDiagonalRoute(sourceNode, targetNode, allNodes);
}

export function getNodeCorners(node) {
  const iconUnitSize =
    node.layoutConfig?.iconUnitSize || DEFAULT_CONFIG.iconUnitSize;
  const width = node.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = node.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = node.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;

  const halfW = width / 2 + margin;
  const halfH = height / 2 + margin;

  return {
    topLeft: [node.x - halfW, node.y - halfH],
    bottomRight: [node.x + halfW, node.y + halfH],
  };
}

function getSourcePoint(sourceNode, targetNode, isDiagonal = false) {
  const width = sourceNode.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = sourceNode.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const totalMargin = margin + 10;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  if (isDiagonal) {
    // For diagonal connections, exit from the corner in the direction of the target
    return {
      point: [
        sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
        sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
      ],
      direction: `diagonal-${dx > 0 ? "right" : "left"}-${dy > 0 ? "down" : "up"}`,
    };
  }

  // For same row/column connections, ensure proper exit direction
  if (Math.abs(dy) < 1) {
    // Same row
    const direction = dx > 0 ? "right" : "left";
    return {
      point: [
        sourceNode.x +
          (direction === "right"
            ? width / 2 + totalMargin
            : -(width / 2 + totalMargin)),
        sourceNode.y,
      ],
      direction: direction,
    };
  } else if (Math.abs(dx) < 1) {
    // Same column
    const direction = dy > 0 ? "down" : "up";
    return {
      point: [
        sourceNode.x,
        sourceNode.y +
          (direction === "down"
            ? height / 2 + totalMargin
            : -(height / 2 + totalMargin)),
      ],
      direction: direction,
    };
  }

  // For other connections, use predominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal predominant - exit from left or right
    const direction = dx > 0 ? "right" : "left";
    return {
      point: [
        sourceNode.x +
          (direction === "right"
            ? width / 2 + totalMargin
            : -(width / 2 + totalMargin)),
        sourceNode.y,
      ],
      direction: direction,
    };
  } else {
    // Vertical predominant - exit from top or bottom
    const direction = dy > 0 ? "down" : "up";
    return {
      point: [
        sourceNode.x,
        sourceNode.y +
          (direction === "down"
            ? height / 2 + totalMargin
            : -(height / 2 + totalMargin)),
      ],
      direction: direction,
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
    // For diagonal connections, arrive at the corner from the direction of the source
    return {
      point: [
        targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
        targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
      ],
      direction: `diagonal-${dx > 0 ? "left" : "right"}-${dy > 0 ? "up" : "down"}`,
    };
  }

  // For same row/column connections, ensure proper arrival direction
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
  } else if (Math.abs(dx) < 1) {
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

  // For other connections, use predominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
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
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  // Calculate diagonal exit and entry points
  const width = sourceNode.layoutConfig?.boxWidth || DEFAULT_CONFIG.boxWidth;
  const height = sourceNode.layoutConfig?.boxHeight || DEFAULT_CONFIG.boxHeight;
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const totalMargin = margin + 10;

  // Calculate diagonal points
  const sourcePoint = [
    sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
    sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
  ];

  const targetPoint = [
    targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
    targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
  ];

  // Check if path is clear
  const directPath = [sourcePoint, targetPoint];
  const otherNodes = allNodes.filter(
    (node) => node !== sourceNode && node !== targetNode
  );

  if (!hasIntersections(directPath, otherNodes, sourceNode, targetNode)) {
    return directPath;
  }

  // If diagonal path is blocked, fall back to orthogonal
  return getOrthogonalRoute(sourceNode, targetNode, allNodes);
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
  const gridSpacing = 500;

  // Convert actual distances to grid units
  const gridUnitsX = Math.abs(dx) / gridSpacing;
  const gridUnitsY = Math.abs(dy) / gridSpacing;

  // Direct neighbors: exactly one grid unit apart in either x or y, aligned in the other
  const isDirectNeighbor =
    (Math.abs(gridUnitsX - 1) < 0.1 && gridUnitsY < 0.1) || // Horizontal neighbor
    (Math.abs(gridUnitsY - 1) < 0.1 && gridUnitsX < 0.1); // Vertical neighbor
  return isDirectNeighbor;
}

function getOrthogonalRoute(sourceNode, targetNode, allNodes) {
  const sourceConnection = getSourcePoint(sourceNode, targetNode);
  const targetConnection = getTargetPoint(sourceNode, targetNode);
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const margin = sourceNode.layoutConfig?.boxMargin || DEFAULT_CONFIG.boxMargin;
  const extraMargin = margin * 3;

  const points = [sourceConnection.point];

  // First segment must strictly follow the departure direction
  const firstSegmentLength = extraMargin * 1.5;
  let firstSegmentPoint;

  switch (sourceConnection.direction) {
    case "right":
      firstSegmentPoint = [
        sourceConnection.point[0] + firstSegmentLength,
        sourceConnection.point[1],
      ];
      break;
    case "left":
      firstSegmentPoint = [
        sourceConnection.point[0] - firstSegmentLength,
        sourceConnection.point[1],
      ];
      break;
    case "up":
      firstSegmentPoint = [
        sourceConnection.point[0],
        sourceConnection.point[1] - firstSegmentLength,
      ];
      break;
    case "down":
      firstSegmentPoint = [
        sourceConnection.point[0],
        sourceConnection.point[1] + firstSegmentLength,
      ];
      break;
    default:
      break;
  }
  points.push(firstSegmentPoint);

  // Handle same row/column cases with intersection checking
  if (Math.abs(dy) < 1 || Math.abs(dx) < 1) {
    const hasIntersectingNodes = allNodes.some((node) => {
      if (node === sourceNode || node === targetNode) return false;

      if (Math.abs(dy) < 1) {
        const minX = Math.min(sourceNode.x, targetNode.x);
        const maxX = Math.max(sourceNode.x, targetNode.x);
        return (
          Math.abs(node.y - sourceNode.y) < node.layoutConfig?.boxHeight &&
          node.x > minX &&
          node.x < maxX
        );
      } else {
        const minY = Math.min(sourceNode.y, targetNode.y);
        const maxY = Math.max(sourceNode.y, targetNode.y);
        return (
          Math.abs(node.x - sourceNode.x) < node.layoutConfig?.boxWidth &&
          node.y > minY &&
          node.y < maxY
        );
      }
    });

    if (hasIntersectingNodes) {
      // Add detour after first segment
      if (Math.abs(dy) < 1) {
        points.push([firstSegmentPoint[0], sourceNode.y + extraMargin * 2]);
        points.push([
          targetConnection.finalSegment[0][0],
          sourceNode.y + extraMargin * 2,
        ]);
      } else {
        points.push([sourceNode.x + extraMargin * 2, firstSegmentPoint[1]]);
        points.push([
          sourceNode.x + extraMargin * 2,
          targetConnection.finalSegment[0][1],
        ]);
      }
    }

    points.push(targetConnection.finalSegment[0]);
    points.push(targetConnection.finalSegment[1]);
    return points;
  }

  // For other cases, continue path after first segment
  if (Math.abs(dx) > Math.abs(dy)) {
    points.push([firstSegmentPoint[0], targetConnection.finalSegment[0][1]]);
  } else {
    points.push([targetConnection.finalSegment[0][0], firstSegmentPoint[1]]);
  }

  points.push(targetConnection.finalSegment[0]);
  points.push(targetConnection.finalSegment[1]);

  return points;
}

function getCurvedRoute(sourceNode, targetNode) {
  const { source, target } = determineOptimalConnectionPoints(
    sourceNode,
    targetNode
  );

  // Use cubic bezier curve for smooth bending
  const dx = target.point[0] - source.point[0];
  const midX = source.point[0] + dx * 0.5;

  return [
    source.point,
    [midX, source.point[1]],
    [midX, target.point[1]],
    target.point,
  ];
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
