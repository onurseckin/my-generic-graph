// Default grid configuration
const DEFAULT_CONFIG = {
  startX: 200,
  startY: 300,
  columnWidth: 200,
  rowHeight: 200,
  columnsPerRow: 3, // This should be overridden by JSON config
  width: 1500,
  height: 1500,
  // Node box configuration
  boxWidth: 120,
  boxHeight: 120,
  boxMargin: 25,
  // Text configuration
  fontSize: 24,
  textMarginTop: 80,
  // SVG viewport control
  svgWidth: 120,
  svgHeight: 120,
  viewBoxWidth: 120,
  viewBoxHeight: 120,
  viewBoxMinX: 0,
  viewBoxMinY: 0,
};

// Validate and normalize format values
function validateConfig(config = {}) {
  // Start with empty object instead of DEFAULT_CONFIG
  const result = {};

  // Handle each property individually
  result.startX = config.startX ?? DEFAULT_CONFIG.startX;
  result.startY = config.startY ?? DEFAULT_CONFIG.startY;
  result.width = config.width ?? DEFAULT_CONFIG.width;
  result.height = config.height ?? DEFAULT_CONFIG.height;

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

  return result;
}

export function arrangeInGrid(input = {}) {
  const nodesArray = input?.nodes || [];
  const mainLayoutConfig = validateConfig(input?.layoutConfig || {});

  const result = {
    nodes: nodesArray.map((node, index) => {
      // Calculate grid positions
      const columnsPerRow = mainLayoutConfig.columnsPerRow || 2; // Default to 2 columns if not set
      const row = Math.floor(index / columnsPerRow);
      const col = index % columnsPerRow;

      // Calculate base grid position
      const gridX =
        mainLayoutConfig.startX +
        col * Math.max(mainLayoutConfig.columnWidth, 50);
      const gridY =
        mainLayoutConfig.startY +
        row * Math.max(mainLayoutConfig.rowHeight, 50);

      // Create node config by merging main config with node-specific config
      const nodeConfig = validateConfig({
        ...mainLayoutConfig,
        ...(node.layoutConfig || {}),
      });

      // Use node's specified position or grid position
      const finalX =
        node.layoutConfig?.x !== undefined
          ? node.layoutConfig.x + mainLayoutConfig.startX
          : gridX;
      const finalY =
        node.layoutConfig?.y !== undefined
          ? node.layoutConfig.y + mainLayoutConfig.startY
          : gridY;

      return {
        ...node,
        x: finalX,
        y: finalY,
        layoutConfig: nodeConfig,
      };
    }),
    config: mainLayoutConfig,
  };

  return result;
}

export function formatGraphData(graphData) {
  try {
    const data =
      typeof graphData === "string" ? JSON.parse(graphData) : graphData;

    // Format the entire graph data
    const formatted = {
      nodes: data.nodes.map((node) => ({
        ...node,
        layoutConfig: node.layoutConfig
          ? validateConfig(node.layoutConfig)
          : undefined,
      })),
      edges: data.edges,
      layoutConfig: validateConfig(data.layoutConfig),
    };

    return JSON.stringify(formatted, null, 2);
  } catch (error) {
    console.error("Error formatting graph data:", error);
    return graphData;
  }
}

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
