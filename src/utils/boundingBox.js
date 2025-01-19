function getSourcePoint(sourceNode, targetNode, isDiagonal = false) {
  const width = sourceNode.layoutConfig?.boxWidth || 100;
  const height = sourceNode.layoutConfig?.boxHeight || 140;
  const margin = sourceNode.layoutConfig?.boxMargin || 15;
  const totalMargin = margin + 10;
  const gridSpacing = 200;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  // For diagonal connections
  if (isDiagonal) {
    return [
      sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
      sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
    ];
  }

  // For far orthogonal connections
  if (Math.abs(dx) > gridSpacing || Math.abs(dy) > gridSpacing) {
    // Determine first segment direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal first - exit from left/right
      return [
        sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
        sourceNode.y,
      ];
    } else {
      // Vertical first - exit from top/bottom
      return [
        sourceNode.x,
        sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
      ];
    }
  }

  // For neighbors and close connections - use original logic
  if (Math.abs(dx) > Math.abs(dy)) {
    return [
      sourceNode.x + Math.sign(dx) * (width / 2 + totalMargin),
      sourceNode.y,
    ];
  } else {
    return [
      sourceNode.x,
      sourceNode.y + Math.sign(dy) * (height / 2 + totalMargin),
    ];
  }
}

function getTargetPoint(sourceNode, targetNode, isDiagonal = false) {
  const width = targetNode.layoutConfig?.boxWidth || 100;
  const height = targetNode.layoutConfig?.boxHeight || 140;
  const margin = targetNode.layoutConfig?.boxMargin || 15;
  const totalMargin = margin + 10;
  const gridSpacing = 200;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  // For diagonal connections
  if (isDiagonal) {
    return [
      targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
      targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
    ];
  }

  // For far orthogonal connections
  if (Math.abs(dx) > gridSpacing || Math.abs(dy) > gridSpacing) {
    // Determine last segment direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal last - enter from left/right
      return [
        targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
        targetNode.y,
      ];
    } else {
      // Vertical last - enter from top/bottom
      return [
        targetNode.x,
        targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
      ];
    }
  }

  // For neighbors and close connections - use original logic
  if (Math.abs(dx) > Math.abs(dy)) {
    return [
      targetNode.x - Math.sign(dx) * (width / 2 + totalMargin),
      targetNode.y,
    ];
  } else {
    return [
      targetNode.x,
      targetNode.y - Math.sign(dy) * (height / 2 + totalMargin),
    ];
  }
}

function getDiagonalRoute(sourceNode, targetNode, allNodes) {
  const [sx, sy] = getSourcePoint(sourceNode, targetNode, true);
  const [tx, ty] = getTargetPoint(sourceNode, targetNode, true);

  const directPath = [
    [sx, sy],
    [tx, ty],
  ];

  // Check for intersections with other nodes
  if (!hasIntersections(directPath, allNodes, sourceNode, targetNode)) {
    return directPath;
  }

  // If there are intersections, fall back to orthogonal routing
  return getOrthogonalRoute(sourceNode, targetNode, allNodes);
}

function debugGridLayout(sourceNode, targetNode, allNodes, connectionType) {
  // Create a larger grid visualization (5x5 to see more)
  const gridSize = 5;
  let gridMap = Array(gridSize)
    .fill(".")
    .map(() => Array(gridSize).fill("."));

  // Helper to convert coordinates to grid positions
  function getGridPosition(x, y) {
    // Normalize by grid spacing (500)
    return {
      col: Math.floor((x + 250) / 500),
      row: Math.floor((y + 250) / 500),
    };
  }

  // Map nodes to grid
  allNodes.forEach((node) => {
    const { row, col } = getGridPosition(node.x, node.y);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      if (node === sourceNode) gridMap[row][col] = "S";
      else if (node === targetNode) gridMap[row][col] = "T";
      else gridMap[row][col] = "N";
    }
  });

  // Print debug info with more details
  console.log("\nConnection Debug:");
  console.log(
    `Source (${sourceNode.x}, ${sourceNode.y}) → Target (${targetNode.x}, ${targetNode.y})`
  );
  console.log(
    `Grid positions: S(${getGridPosition(sourceNode.x, sourceNode.y).col},${getGridPosition(sourceNode.x, sourceNode.y).row}) → T(${getGridPosition(targetNode.x, targetNode.y).col},${getGridPosition(targetNode.x, targetNode.y).row})`
  );
  console.log(`Type: ${connectionType}`);
  console.log(
    `Distance: dx=${targetNode.x - sourceNode.x}, dy=${targetNode.y - sourceNode.y}`
  );
  console.log("Grid Layout (5x5):");
  gridMap.forEach((row, i) => console.log(`${i}: ${row.join(" ")}`));
}

function debugGridStructure(allNodes) {
  console.log("\n=== Grid Structure Analysis ===");

  // Sort nodes by position for clearer output
  const sortedNodes = [...allNodes].sort((a, b) => {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  // Get layout config from first node (assuming consistent across all nodes)
  const config = sortedNodes[0].layoutConfig || {};
  const {
    columnWidth = 200,
    rowHeight = 200,
    boxWidth = 120,
    boxHeight = 120,
    boxMargin = 15,
  } = config;

  console.log(`Grid Configuration:
    - Column Width: ${columnWidth}
    - Row Height: ${rowHeight}
    - Box Size: ${boxWidth}x${boxHeight}
    - Box Margin: ${boxMargin}
    - Total Spacing: ${columnWidth + boxWidth + boxMargin * 2}x${rowHeight + boxHeight + boxMargin * 2}
  `);

  console.log("\nNode Positions:");
  sortedNodes.forEach((node, i) => {
    console.log(`Node ${i}: (${node.x}, ${node.y})`);
  });

  console.log("\nPossible Connections:");
  for (let i = 0; i < sortedNodes.length; i++) {
    for (let j = i + 1; j < sortedNodes.length; j++) {
      const source = sortedNodes[i];
      const target = sortedNodes[j];
      const dx = target.x - source.x;
      const dy = target.y - source.y;

      console.log(`\nNode ${i} → Node ${j}:`);
      console.log(`  Distance: dx=${dx}, dy=${dy}`);

      // Analyze relationship
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        console.log("  Type: Same position");
      } else if (Math.abs(dx) < 1) {
        console.log("  Type: Same column");
      } else if (Math.abs(dy) < 1) {
        console.log("  Type: Same row");
      } else if (Math.abs(dx) === Math.abs(dy)) {
        console.log("  Type: Diagonal");
      } else {
        console.log("  Type: Other");
      }
    }
  }
}

function isNeighbor(dx, dy, columnSpacing, rowSpacing) {
  // Convert to absolute values for easier comparison
  dx = Math.abs(dx);
  dy = Math.abs(dy);

  // Direct neighbors are exactly one column or row apart
  const isDirect =
    (dx === columnSpacing / 2 && dy === 0) || // Same row
    (dx === 0 && dy === rowSpacing / 2); // Same column

  // Cross/diagonal neighbors are one column AND one row apart
  const isCross = dx === columnSpacing / 2 && dy === rowSpacing / 2;

  return isDirect || isCross;
}

function getOrthogonalRoute(sourceNode, targetNode, allNodes) {
  // Run debug analysis first
  debugGridStructure(allNodes);

  // Get complete spacing from layoutConfig
  const columnWidth = sourceNode.layoutConfig?.columnWidth || 200;
  const rowHeight = sourceNode.layoutConfig?.rowHeight || 200;
  const boxWidth = sourceNode.layoutConfig?.boxWidth || 120;
  const boxHeight = sourceNode.layoutConfig?.boxHeight || 120;
  const boxMargin = sourceNode.layoutConfig?.boxMargin || 15;

  // Calculate total spacing including box size and margins
  const totalColumnSpacing = columnWidth + boxWidth + boxMargin * 2;
  const totalRowSpacing = rowHeight + boxHeight + boxMargin * 2;

  // Update spacing calculations to match grid layout
  const columnSpacing = 600; // 2 * columnWidth (300px between nodes)
  const rowSpacing = 1000; // 2 * rowHeight (500px between nodes)

  // Check if nodes are neighbors based on actual grid distances
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  const areNeighbors = isNeighbor(dx, dy, columnSpacing, rowSpacing);

  // Debug current layout config
  console.log(
    `Layout config: grid(${columnWidth}x${rowHeight}), box(${boxWidth}x${boxHeight}), total spacing(${totalColumnSpacing}x${totalRowSpacing})`
  );

  // 1. Direct or cross neighbors
  if (areNeighbors) {
    console.log("Direct/Cross neighbor connection");
    const [sx, sy] = getSourcePoint(sourceNode, targetNode);
    const [tx, ty] = getTargetPoint(sourceNode, targetNode);
    return [
      [sx, sy],
      [tx, ty],
    ];
  }

  // 2. Same row/column
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    console.log("Same row/column connection");
    const [sx, sy] = getSourcePoint(sourceNode, targetNode);
    const [tx, ty] = getTargetPoint(sourceNode, targetNode);
    return [
      [sx, sy],
      [tx, ty],
    ];
  }

  // 3. Far connections
  if (Math.abs(dx) > totalColumnSpacing || Math.abs(dy) > totalRowSpacing) {
    console.log("Far connection");
    const isRight = dx > 0;
    const isBelow = dy > 0;

    const [sx, sy] = getSourcePoint(sourceNode, targetNode);
    const [tx, ty] = getTargetPoint(sourceNode, targetNode);

    const initialOffset = boxMargin * 2;
    const clearanceOffset = boxHeight + boxMargin;
    const points = [[sx, sy]];

    if (Math.abs(dx) > Math.abs(dy)) {
      points.push([sx + (isRight ? 1 : -1) * initialOffset, sy]);
      points.push([
        sx + (isRight ? 1 : -1) * initialOffset,
        ty + (isBelow ? 1 : -1) * clearanceOffset,
      ]);
      points.push([tx, ty + (isBelow ? 1 : -1) * clearanceOffset]);
      points.push([tx, ty]);
    } else {
      points.push([sx, sy + (isBelow ? 1 : -1) * initialOffset]);
      points.push([
        tx + (isRight ? 1 : -1) * clearanceOffset,
        sy + (isBelow ? 1 : -1) * initialOffset,
      ]);
      points.push([tx + (isRight ? 1 : -1) * clearanceOffset, ty]);
      points.push([tx, ty]);
    }

    return points;
  }

  // 4. Regular non-neighbor orthogonal
  console.log("Regular connection");
  const [sx, sy] = getSourcePoint(sourceNode, targetNode);
  const [tx, ty] = getTargetPoint(sourceNode, targetNode);
  return [
    [sx, sy],
    [sx, ty],
    [tx, ty],
  ];
}

function getCurvedRoute(sourceNode, targetNode) {
  const [sx, sy] = getSourcePoint(sourceNode, targetNode);
  const [tx, ty] = getTargetPoint(sourceNode, targetNode);

  // Use cubic bezier curve for smooth bending
  const dx = tx - sx;
  const dy = ty - sy;
  const midX = sx + dx * 0.5;

  return [
    [sx, sy],
    [midX, sy],
    [midX, ty],
    [tx, ty],
  ];
}

function isNeighborInGrid(sourceNode, targetNode) {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;

  // Get complete spacing from layoutConfig
  const columnWidth = sourceNode.layoutConfig?.columnWidth || 200;
  const rowHeight = sourceNode.layoutConfig?.rowHeight || 200;
  const boxWidth = sourceNode.layoutConfig?.boxWidth || 120;
  const boxMargin = sourceNode.layoutConfig?.boxMargin || 15;

  // Calculate total spacing including box size and margins
  const totalColumnSpacing = columnWidth + boxWidth + boxMargin * 2;
  const totalRowSpacing = rowHeight + boxWidth + boxMargin * 2;

  // Debug neighbor check with actual distances and config
  console.log(`Neighbor check: dx=${dx}, dy=${dy}`);
  console.log(
    `Total spacing: column=${totalColumnSpacing}, row=${totalRowSpacing}`
  );

  // Direct neighbors: exactly one node spacing apart (including box size)
  const isDirectNeighbor =
    (Math.abs(Math.abs(dx) - totalColumnSpacing) < 1 && Math.abs(dy) < 1) || // Horizontal neighbor
    (Math.abs(Math.abs(dy) - totalRowSpacing) < 1 && Math.abs(dx) < 1); // Vertical neighbor

  // Cross neighbors: diagonal one node spacing
  const isCrossNeighbor =
    Math.abs(Math.abs(dx) - totalColumnSpacing) < 1 &&
    Math.abs(Math.abs(dy) - totalRowSpacing) < 1;

  console.log(`Is direct: ${isDirectNeighbor}, Is cross: ${isCrossNeighbor}`);
  return isDirectNeighbor || isCrossNeighbor;
}

function shouldUseDiagonalRoute(sourceNode, targetNode, allNodes, edge) {
  // Respect explicit edge types
  if (edge.type === "diagonal") return true;
  if (edge.type === "orthogonal") return false;

  // Always use orthogonal for neighbors
  if (isNeighborInGrid(sourceNode, targetNode)) return false;

  // For non-neighbors, check if diagonal path is clear
  const [sx, sy] = getSourcePoint(sourceNode, targetNode, true);
  const [tx, ty] = getTargetPoint(sourceNode, targetNode, true);

  const directPath = [
    [sx, sy],
    [tx, ty],
  ];
  return !hasIntersections(directPath, allNodes, sourceNode, targetNode);
}

export function getEdgeRoute(sourceNode, targetNode, allNodes, edge) {
  if (shouldUseDiagonalRoute(sourceNode, targetNode, allNodes, edge)) {
    return getDiagonalRoute(sourceNode, targetNode, allNodes);
  }
  return getOrthogonalRoute(sourceNode, targetNode, allNodes);
}

export function getNodeCorners(node) {
  const width = node.layoutConfig?.boxWidth || 100;
  const height = node.layoutConfig?.boxHeight || 140;
  const margin = node.layoutConfig?.boxMargin || 15;

  const halfW = width / 2 + margin;
  const halfH = height / 2 + margin;

  return {
    topLeft: [node.x - halfW, node.y - halfH],
    bottomRight: [node.x + halfW, node.y + halfH],
  };
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
