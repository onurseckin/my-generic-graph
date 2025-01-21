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
  boxMargin: 50,
  // Text configuration
  fontSize: 24,
  textMarginTop: 20,
  // SVG viewport control
  svgWidth: 100,
  svgHeight: 100,
  viewBoxWidth: 100,
  viewBoxHeight: 100,
  viewBoxMinX: 0,
  viewBoxMinY: 0,
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

  return result;
}

export function arrangeInGrid(input = {}) {
  const nodesArray = input?.nodes || [];
  const mainLayoutConfig = validateConfig(input?.layoutConfig || {});

  const result = {
    nodes: nodesArray.map((node, index) => {
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

export const formatGraphData = (jsonString) => {
  try {
    // First clean up the input
    let cleanJson = jsonString
      // Remove trailing spaces in values
      .replace(/:\s*"([^"]*?)\s+"/g, ':"$1"')
      // Convert numeric strings to numbers (except for specific fields)
      .replace(
        /"(x|y|cx|cy|r|width|height|x1|x2|y1|y2|fontSize|startX|startY|columnWidth|rowHeight|boxWidth|boxHeight|boxMargin|textMarginTop|columnsPerRow)":\s*"?(-?\d+\.?\d*)"?/g,
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
        textMarginTop: Number(parsed.layoutConfig?.textMarginTop) || 100,
        columnsPerRow: Number(parsed.layoutConfig?.columnsPerRow) || 2,
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
