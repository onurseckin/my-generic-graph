// Default grid configuration
export const DEFAULT_CONFIG = {
  startX: 150,
  startY: 150,
  columnWidth: 600,
  rowHeight: 600,
  columnsPerRow: 3, // This should be overridden by JSON config
  width: 5000,
  height: 5000,
  // Node box configuration
  boxWidth: 100,
  boxHeight: 100,
  boxMargin: 20,
  // Text configuration
  fontSize: 24,
  textMarginTop: 75,
  // SVG viewport control
  svgWidth: 120,
  svgHeight: 120,
  viewBoxWidth: 100,
  viewBoxHeight: 100,
  viewBoxMinX: 0,
  viewBoxMinY: 0,
  // New single source of truth for icon scaling:
  iconUnitSize: 3, // or whatever default you want
  // NEW: maximum allowed icon scale
  maxIconSize: 3,
};

// Validate and normalize format values
function validateConfig(config = {}) {
  const result = {};

  // Handle each property individually
  result.startX = config.startX ?? DEFAULT_CONFIG.startX;
  result.startY = config.startY ?? DEFAULT_CONFIG.startY;
  result.width = config.width ?? DEFAULT_CONFIG.width;
  result.height = config.height ?? DEFAULT_CONFIG.height;
  result.columnsPerRow = config.columnsPerRow ?? DEFAULT_CONFIG.columnsPerRow;

  // Box configuration with minimums
  result.boxWidth =
    config.boxWidth !== undefined
      ? Math.max(config.boxWidth, 1)
      : DEFAULT_CONFIG.boxWidth;

  result.boxHeight =
    config.boxHeight !== undefined
      ? Math.max(config.boxHeight, 1)
      : DEFAULT_CONFIG.boxHeight;

  result.boxMargin =
    config.boxMargin !== undefined
      ? Math.max(config.boxMargin, 0)
      : DEFAULT_CONFIG.boxMargin;

  // Grid configuration with minimums
  result.columnWidth =
    config.columnWidth !== undefined
      ? Math.max(config.columnWidth, 1)
      : DEFAULT_CONFIG.columnWidth;

  result.rowHeight =
    config.rowHeight !== undefined
      ? Math.max(config.rowHeight, 1)
      : DEFAULT_CONFIG.rowHeight;

  // Text configuration (no minimums needed)
  result.fontSize = config.fontSize ?? DEFAULT_CONFIG.fontSize;
  result.textMarginTop = config.textMarginTop ?? DEFAULT_CONFIG.textMarginTop;

  // SVG viewport configuration
  result.svgWidth = config.svgWidth ?? DEFAULT_CONFIG.svgWidth;
  result.svgHeight = config.svgHeight ?? DEFAULT_CONFIG.svgHeight;
  result.viewBoxWidth = config.viewBoxWidth ?? DEFAULT_CONFIG.viewBoxWidth;
  result.viewBoxHeight = config.viewBoxHeight ?? DEFAULT_CONFIG.viewBoxHeight;
  result.viewBoxMinX = config.viewBoxMinX ?? DEFAULT_CONFIG.viewBoxMinX;
  result.viewBoxMinY = config.viewBoxMinY ?? DEFAULT_CONFIG.viewBoxMinY;

  // Our new iconUnitSize:
  result.iconUnitSize =
    config.iconUnitSize !== undefined
      ? Math.max(config.iconUnitSize, 1)
      : DEFAULT_CONFIG.iconUnitSize;

  // NEW: read or default to maxIconSize
  result.maxIconSize =
    config.maxIconSize !== undefined
      ? Math.max(config.maxIconSize, 1)
      : DEFAULT_CONFIG.maxIconSize;

  return result;
}

export function arrangeInGrid(input = {}) {
  const nodesArray = input?.nodes || [];
  const edgesArray = input?.edges || [];
  const mainLayoutConfig = validateConfig(input?.layoutConfig || {});

  // Calculate scaling factors based on default values
  const columnScale = mainLayoutConfig.columnWidth / DEFAULT_CONFIG.columnWidth;
  const rowScale = mainLayoutConfig.rowHeight / DEFAULT_CONFIG.rowHeight;

  // Process nodes first to have their positions for edge calculations
  const processedNodes = nodesArray.map((node, index) => {
    // Calculate grid positions
    const columnsPerRow =
      mainLayoutConfig.columnsPerRow || DEFAULT_CONFIG.columnsPerRow;
    const row = Math.floor(index / columnsPerRow);
    const col = index % columnsPerRow;

    // Calculate base grid position
    const gridX =
      mainLayoutConfig.startX +
      col * Math.max(mainLayoutConfig.columnWidth, 50);
    const gridY =
      mainLayoutConfig.startY + row * Math.max(mainLayoutConfig.rowHeight, 50);

    // Create node config by merging main config with node-specific config
    const nodeConfig = validateConfig({
      ...mainLayoutConfig,
      ...(node.layoutConfig || {}),
    });

    // Get base position (either from layoutConfig or grid)
    const baseX =
      node.layoutConfig?.x !== undefined
        ? node.layoutConfig.x
        : gridX - mainLayoutConfig.startX;
    const baseY =
      node.layoutConfig?.y !== undefined
        ? node.layoutConfig.y
        : gridY - mainLayoutConfig.startY;

    // Apply scaling to the relative positions
    const scaledX = baseX * columnScale;
    const scaledY = baseY * rowScale;

    // Add startX/startY back to get final position
    const finalX = mainLayoutConfig.startX + scaledX;
    const finalY = mainLayoutConfig.startY + scaledY;

    return {
      ...node,
      x: finalX,
      y: finalY,
      layoutConfig: nodeConfig,
    };
  });

  // Create a map of node positions for edge processing
  const nodePositions = {};
  processedNodes.forEach((node) => {
    nodePositions[node.id] = {
      x: node.x,
      y: node.y,
    };
  });

  // Process edges with scaled positions
  const processedEdges = edgesArray.map((edge) => {
    const sourcePos = nodePositions[edge.source];
    const targetPos = nodePositions[edge.target];

    if (!sourcePos || !targetPos) {
      console.warn(
        `Missing node position for edge: ${edge.source} -> ${edge.target}`
      );
      return edge;
    }

    // Calculate control points for the edge (if needed)
    const controlPoints = calculateControlPoints(
      sourcePos,
      targetPos,
      columnScale,
      rowScale
    );

    return {
      ...edge,
      sourceX: sourcePos.x,
      sourceY: sourcePos.y,
      targetX: targetPos.x,
      targetY: targetPos.y,
      ...controlPoints,
    };
  });

  return {
    nodes: processedNodes,
    edges: processedEdges,
    config: mainLayoutConfig,
  };
}

// Helper function to calculate control points for edges
function calculateControlPoints(source, target, columnScale, rowScale) {
  // Calculate the midpoint
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  // Calculate the distance between points
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate angle between points
  const angle = Math.atan2(dy, dx);

  // Use fixed base offset that's proportional to distance but not affected by scaling
  const baseOffset = Math.min(distance * 0.2, 50);

  // Calculate perpendicular offset
  const perpX = Math.cos(angle - Math.PI / 2) * baseOffset;
  const perpY = Math.sin(angle - Math.PI / 2) * baseOffset;

  // Create control points perpendicular to the line between points
  return {
    controlPoint1X: midX + perpX,
    controlPoint1Y: midY + perpY,
    controlPoint2X: midX + perpX,
    controlPoint2Y: midY + perpY,
  };
}

export const formatGraphData = (jsonString) => {
  try {
    // First clean up the input
    let cleanJson = jsonString
      // Remove trailing spaces in values
      .replace(/:\s*"([^"]*?)\s+"/g, ':"$1"')
      // Convert numeric strings to numbers (except for specific fields)
      .replace(
        /"(x|y|cx|cy|r|width|height|x1|x2|y1|y2|fontSize|startX|startY|columnWidth|rowHeight|boxWidth|boxHeight|boxMargin|textMarginTop|columnsPerRow|iconUnitSize|maxIconSize)":\s*"?(-?\d+\.?\d*)"?/g,
        '"$1":$2'
      )
      // Fix property names with leading spaces
      .replace(/"\s+(\w+)":/g, '"$1":')
      // Remove any trailing commas
      .replace(/,(\s*[}\]])/g, "$1")
      // Ensure text content is properly quoted
      .replace(/"content":\s*(\d+)\s*,/g, '"content":"$1",')
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Validate structure and ensure numeric values
    const validatedData = {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      layoutConfig: {
        startX: Number(parsed.layoutConfig?.startX) || 250,
        startY: Number(parsed.layoutConfig?.startY) || 250,
        columnWidth: Number(parsed.layoutConfig?.columnWidth) || 350,
        rowHeight: Number(parsed.layoutConfig?.rowHeight) || 350,
        boxWidth: Number(parsed.layoutConfig?.boxWidth) || 100,
        boxHeight: Number(parsed.layoutConfig?.boxHeight) || 100,
        boxMargin: Number(parsed.layoutConfig?.boxMargin) || 20,
        fontSize: Number(parsed.layoutConfig?.fontSize) || 24,
        textMarginTop: Number(parsed.layoutConfig?.textMarginTop) || 75,
        columnsPerRow: Number(parsed.layoutConfig?.columnsPerRow) || 2,
        // NEW: parse iconUnitSize and maxIconSize
        iconUnitSize: Number(parsed.layoutConfig?.iconUnitSize) || 1,
        maxIconSize: Number(parsed.layoutConfig?.maxIconSize) || 12,
      },
    };

    return JSON.stringify(validatedData, null, 2);
  } catch (error) {
    throw new Error(`JSON formatting failed: ${error.message}`);
  }
};

export function calculateGraphDimensions(nodes, config) {
  if (!nodes.length) return config;

  const maxCol = Math.max(
    ...nodes.map((node) => node.layoutConfig.column || 0)
  );
  const maxRow = Math.max(...nodes.map((node) => node.layoutConfig.row || 0));

  return {
    ...config,
    width: Math.max(
      config.width,
      (maxCol + 1) * config.columnWidth + config.startX
    ),
    height: Math.max(
      config.height,
      (maxRow + 1) * config.rowHeight + config.startY
    ),
  };
}
