import dayjs from "dayjs";
import { Buffer } from "buffer";
import pixelWidth from "string-pixel-width";

// =============================================================================
// ENVIRONMENT DETECTION & CONSTANTS
// =============================================================================

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

const BufferObj = isNode ? global.Buffer : Buffer;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sanitizes a key for use in Function constructor
 * Replaces special characters and adds prefix if key starts with number
 */
const sanitizeKey = (key) => {
  let sanitized = key.replace(/[^a-zA-Z0-9]/g, "_");
  if (/^[0-9]/.test(sanitized)) {
    sanitized = "key_" + sanitized;
  }
  return sanitized;
};

/**
 * Evaluates a condition string against provided data
 * @param {string} conditionString - The condition to evaluate
 * @param {object} data - Data object to evaluate against
 * @returns {boolean} Result of condition evaluation
 */
const evaluateCondition = (conditionString, data) => {
  if (typeof conditionString !== "string" || conditionString.trim() === "") {
    return true;
  }

  // Create sanitized version of data object
  const sanitizedData = {};
  Object.entries(data).forEach(([key, value]) => {
    sanitizedData[sanitizeKey(key)] = value;
  });

  // Sanitize condition string to use sanitized keys
  let sanitizedCondition = conditionString;
  Object.keys(data).forEach((key) => {
    const sanitizedKeyName = sanitizeKey(key);
    if (key !== sanitizedKeyName) {
      sanitizedCondition = sanitizedCondition.replace(
        new RegExp(key, "g"),
        sanitizedKeyName
      );
    }
  });

  try {
    return new Function(
      ...Object.keys(sanitizedData),
      `return ${sanitizedCondition};`
    )(...Object.values(sanitizedData));
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
};

/**
 * Checks if a variable is a string
 */
const isString = (variable) => typeof variable === "string";

/**
 * Checks if a variable is an object (excluding arrays)
 */
const isObject = (input) =>
  typeof input === "object" && input !== null && !Array.isArray(input);

/**
 * Gets a nested value from an object based on a path array
 * @param {object} obj - Source object
 * @param {array} path - Array of keys representing the path
 * @returns {*} Value at the path or empty string if not found
 */
const getValueFromPath = (obj, path) => {
  let result = path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );

  // Clean HTML tags and whitespace from strings (except base64 data)
  if (typeof result === "string" && !result.slice(0, 50).includes("base64")) {
    result = result
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return result === null || result === undefined ? "" : result;
};

/**
 * Retrieves a value based on its type from an object
 */
const getValueBasedOnType = (input, obj) => {
  try {
    if (obj.type.includes(input)) {
      return obj[input] !== undefined ? obj[input] : input;
    }
    return null;
  } catch (error) {
    return "";
  }
};

/**
 * Resolves a value that can be either static ($-prefixed) or from data
 * @param {*} value - Value to resolve (can be array path or direct value)
 * @param {object} staticData - Static data source
 * @param {object} dynamicData - Dynamic data source
 * @returns {*} Resolved value
 */
const resolveValue = (value, staticData, dynamicData) => {
  if (!Array.isArray(value)) return value;

  if (value[0] === "$") {
    return getValueFromPath(staticData, value.slice(1));
  }
  return dynamicData ? getValueFromPath(dynamicData, value) : value;
};

/**
 * Applies prefix and suffix to a value
 * @param {*} value - Base value
 * @param {object} options - Options containing prefix, suffix, and their delimiters
 * @param {object} staticData - Static data source
 * @param {object} dynamicData - Dynamic data source (for table row data)
 * @returns {*} Value with prefix and suffix applied
 */
const applyPrefixSuffix = (value, options, staticData, dynamicData = null) => {
  const {
    prefix,
    afterPrefix = "",
    suffix,
    beforeSuffix = "",
  } = options;

  let result = value;
  let resolvedPrefix = prefix;
  let resolvedSuffix = suffix;

  // Resolve prefix if it's an array path
  if (resolvedPrefix && Array.isArray(resolvedPrefix)) {
    resolvedPrefix = resolveValue(resolvedPrefix, staticData, dynamicData);
  }

  // Resolve suffix if it's an array path
  if (resolvedSuffix && Array.isArray(resolvedSuffix)) {
    resolvedSuffix = resolveValue(resolvedSuffix, staticData, dynamicData);
  }

  // Apply prefix
  if (resolvedPrefix) {
    result = resolvedPrefix + afterPrefix + result;
  }

  // Apply suffix
  if (resolvedSuffix) {
    result = result + beforeSuffix + resolvedSuffix;
  }

  return result;
};

/**
 * Decodes base64-encoded SVG data
 */
const decodeBase64Svg = (base64Data) => {
  if (base64Data.startsWith("data:image/svg+xml;base64,")) {
    const base64String = base64Data.replace("data:image/svg+xml;base64,", "");
    return Buffer.from(base64String, "base64").toString("utf-8");
  }
  return base64Data;
};

/**
 * Formats a value to fixed decimal places
 */
const formatToFixed = (value, toFixed) => {
  if (!toFixed || toFixed <= 0) return value;

  try {
    let numValue = value;
    if (typeof numValue === "string") {
      numValue = parseFloat(numValue);
    }
    return numValue.toFixed(toFixed);
  } catch (error) {
    return value;
  }
};

/**
 * Extracts additional properties from an object, excluding specified keys
 */
const extractAdditionalProps = (obj, excludeKeys) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (!excludeKeys.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

// =============================================================================
// TABLE LAYOUT DEFINITIONS
// =============================================================================

const TABLE_LAYOUTS = {
  noBorders: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  },

  outside: {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0),
    vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? 1 : 0),
    hLineColor: () => "black",
    vLineColor: () => "black",
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  },

  onlyVerticalLinesWithClosedBorders: {
    hLineWidth: (i, node) => {
      if (i === 0 || i === 1 || i === node.table.body.length) return 1;
      return node.onlyVerticalLinesWithClosedBorders_extra_row_height ?? 0.5;
    },
    vLineWidth: () => 1,
    vLineColor: () => "black",
    hLineColor: (i, node) => {
      if (i === 0 || i === 1 || i === node.table.body.length) return "black";
      return node.onlyVerticalLinesWithClosedBorders_extra_row_color ?? "lightgray";
    },
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: (i, node) => {
      const DEFAULT_PADDING = 0;

      if (i === node.table.body.length - 1) {
        const currentPosition = node.positions[node.positions.length - 1];
        const text = node.table.body[node.table.body.length - 1][0].text;
        const width = pixelWidth(text, { size: 10 });
        const lines = Math.ceil(width / 250);
        const currentHeight = currentPosition.top;

        let paddingBottom =
          currentPosition.pageInnerHeight + (280 - currentHeight) - lines * 10;
        paddingBottom = paddingBottom < 0 ? 280 - paddingBottom : paddingBottom;
        return paddingBottom > 300 ? 300 : paddingBottom;
      }

      return DEFAULT_PADDING;
    },
  },
};

/**
 * Gets the appropriate table layout configuration
 */
const getTableLayout = (layoutName) => {
  return TABLE_LAYOUTS[layoutName] || layoutName;
};

// =============================================================================
// SIGNATURE TABLE GENERATION
// =============================================================================

/**
 * Creates an SVG with rotated text (90 degrees counter-clockwise)
 */
const createRotatedTextSvg = (text, height, fontSize = 8) => {
  const svgWidth = 16;
  const centerX = svgWidth / 2;
  const centerY = height / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}">
    <text x="${centerX}" y="${centerY}" 
          transform="rotate(-90, ${centerX}, ${centerY})" 
          font-size="${fontSize}" 
          fill="#555555" 
          text-anchor="middle" 
          dominant-baseline="middle"
          font-family="Helvetica, Arial, sans-serif">${text}</text>
  </svg>`;
};

/**
 * Creates an invalid SVG placeholder
 */
const createInvalidSvgPlaceholder = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">
    <rect width="100" height="50" fill="#ccc"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-size="10">
      Invalid SVG
    </text>
  </svg>`;
};

/**
 * Calculates font size based on name length to prevent overflow
 */
const calculateNameFontSize = (displayName) => {
  const baseFontSize = 10.5;
  const minFontSize = 8;
  const maxNameLength = 15;

  if (displayName.length > maxNameLength) {
    return Math.max(
      minFontSize,
      baseFontSize - Math.floor((displayName.length - maxNameLength) / 3)
    );
  }
  return baseFontSize;
};

/**
 * Creates a signature cell with attendee type (left column layout)
 */
const createSignatureCellWithType = (signatureData, displayName, attendeeTypeValue, config) => {
  const { signatureRowHeight, nameRowHeight, nameFontSize, nameVerticalMargin } = config;
  const rotatedSvg = createRotatedTextSvg(attendeeTypeValue, signatureRowHeight);

  return {
    table: {
      headerRows: 0,
      dontBreakRows: true,
      widths: [18, "*"],
      body: [
        [
          {
            svg: rotatedSvg,
            fit: [16, signatureRowHeight],
            alignment: "center",
          },
          {
            svg: signatureData,
            width: 100,
            height: 50,
            alignment: "center",
            margin: [0, 2, 0, 2],
          },
        ],
        [
          {
            text: displayName,
            alignment: "center",
            fontSize: nameFontSize,
            color: "#545454",
            noWrap: true,
            margin: [0, nameVerticalMargin, 0, 0],
            colSpan: 2,
          },
          {},
        ],
      ],
      heights: [signatureRowHeight, nameRowHeight],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? 1 : 0),
      hLineColor: () => "#cccccc",
      vLineColor: () => "#cccccc",
      paddingLeft: () => 1,
      paddingRight: () => 1,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 0],
  };
};

/**
 * Creates a simple signature cell (no attendee type)
 */
const createSimpleSignatureCell = (signatureData, displayName, config) => {
  const { signatureRowHeight, nameRowHeight, nameFontSize, nameVerticalMargin } = config;

  return {
    table: {
      headerRows: 0,
      dontBreakRows: true,
      widths: ["*"],
      heights: [signatureRowHeight, nameRowHeight],
      body: [
        [
          {
            svg: signatureData,
            width: 100,
            height: 50,
            alignment: "center",
            margin: [0, 2, 0, 2],
          },
        ],
        [
          {
            text: displayName,
            alignment: "center",
            fontSize: nameFontSize,
            color: "#545454",
            noWrap: true,
            margin: [0, nameVerticalMargin, 0, 0],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 1,
      paddingRight: () => 1,
      paddingTop: () => 1,
      paddingBottom: () => 1,
    },
    margin: [0, 0, 0, 0],
  };
};

/**
 * Creates a title box with optional divider for signature section
 */
const createTitleBox = (title, titleMargin, overflowMargin, showDivider = false, titleFontSize = 12) => {
  const stackContent = [
    {
      text: title,
      alignment: "center",
      bold: true,
      margin: [0, 0, 0, 0],
      fontSize: titleFontSize,
    },
  ];
  if (showDivider) {
    stackContent.push({
      table: {
        widths: ["*"],
        body: [[{ text: "" }]],
      },
      layout: {
        hLineWidth: (i) => (i === 1 ? 0.5 : 0),
        vLineWidth: () => 0,
        hLineColor: () => "#cccccc",
      },
    });
  }
  return {
    stack: stackContent,
    margin: [
      titleMargin[0] || 0,
      titleMargin[1] || 0,
      Math.max(titleMargin[2] || 0, overflowMargin),
      titleMargin[3] || 0,
    ],
  };
};

/**
 * Generates a signature table from layout and data
 */
const generateSignatureTable = (content, data) => {
  const rowData = getValueFromPath(data, content.rowData) || [];

  // Configuration
  const maxItemsPerRow = content.maxItemsPerRow || content.minItemsPerRow || 2;
  const minItemsPerRow = content.minItemsPerRow || maxItemsPerRow;
  const columnsPerRow = Math.max(minItemsPerRow, maxItemsPerRow);
  const showTitle = content.showTitle !== false;
  const titleFontSize = content.titleFontSize ?? 12;
  const boxGap = content.boxGap ?? 3;
  const titleMargin = content.titleMargin ?? [0, 5, 0, 5];
  const overflowMargin = 0;

  const showTitleDivider = content.showTitleDivider === true;
  const titleBoxObj = createTitleBox(
    content.title ?? "Signatures",
    titleMargin,
    overflowMargin,
    showTitleDivider,
    titleFontSize
  );

  // Helper to create empty placeholder cell
  const createEmptyCell = () => ({ text: "" });

  // Helper to fill row to minimum columns
  const fillRowToMinColumns = (row) => {
    const filledRow = [...row];
    while (filledRow.length < columnsPerRow) {
      filledRow.push(createEmptyCell());
    }
    return filledRow;
  };

  // Handle empty data case
  if (!Array.isArray(rowData) || rowData.length === 0) {
    const emptyContent = [];
    if (showTitle) {
      emptyContent.push(titleBoxObj);
    }
    emptyContent.push({
      text: content.placeholder ?? "No signatures available",
      alignment: "center",
      margin: [0, 0, 0, 0],
    });
    return { stack: emptyContent };
  }

  const tableBody = [];
  let currentRow = [];

  // Fixed dimensions
  const signatureRowHeight = 50;
  const nameRowHeight = 14;

  // Process each attendee
  rowData.forEach((attendee) => {
    let signatureData = getValueFromPath(attendee, content.signature) || "";
    signatureData = decodeBase64Svg(signatureData);

    if (!signatureData.startsWith("<svg")) {
      signatureData = createInvalidSvgPlaceholder();
    }

    const displayName = getValueFromPath(attendee, content.displayNames) || "Unknown";
    const isAttendeeTypeEnabled = !!content.attendeeType;
    const attendeeTypeValue = isAttendeeTypeEnabled ? attendee.attendeeType || null : null;

    const nameFontSize = calculateNameFontSize(displayName);
    const nameVerticalMargin = Math.max(0, Math.floor((nameRowHeight - nameFontSize) / 2));

    const cellConfig = {
      signatureRowHeight,
      nameRowHeight,
      nameFontSize,
      nameVerticalMargin,
    };

    const signatureCell =
      isAttendeeTypeEnabled && attendeeTypeValue
        ? createSignatureCellWithType(signatureData, displayName, attendeeTypeValue, cellConfig)
        : createSimpleSignatureCell(signatureData, displayName, cellConfig);

    currentRow.push(signatureCell);

    if (currentRow.length === maxItemsPerRow) {
      tableBody.push(fillRowToMinColumns(currentRow));
      currentRow = [];
    }
  });

  // Handle remaining items in last row
  if (currentRow.length > 0) {
    tableBody.push(fillRowToMinColumns(currentRow));
  }

  // Build result stack
  const resultStack = [];

  if (showTitle) {
    resultStack.push(titleBoxObj);
  }

  if (tableBody.length > 0) {
    resultStack.push({
      table: {
        widths: Array(columnsPerRow).fill("*"),
        body: tableBody,
        headerRows: 0,
        dontBreakRows: true,
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: (i) => (i === 0 ? 0 : boxGap / 2),
        paddingRight: (i, node) =>
          i === node.table.widths.length - 1 ? 0 : boxGap / 2,
        paddingTop: () => 0,
        paddingBottom: () => boxGap,
      },
      margin: [0, 0, overflowMargin, 0],
    });
  }

  return {
    stack: resultStack,
    margin: [0, 0, 0, 0],
    width: "100%",
  };
};

// =============================================================================
// DIVIDER BUILDER
// =============================================================================

/**
 * Builds a horizontal divider for pdfmake
 */
const buildDivider = (content) => {
  const lineWidth = content.lineWidth ?? 1;
  const color = content.color ?? "black";
  const margin = content.margin ?? [0, 0, 0, 0];

  if (content.useCanvas === true) {
    const width = content.width != null ? content.width : 1000;
    return {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: width,
          y2: 0,
          lineWidth,
          lineColor: color,
        },
      ],
      margin,
    };
  }

  // Table-based divider: full width, reliable line thickness
  // Explicit zero padding so production build matches dev (pdfmake default padding varies by environment)
  return {
    table: {
      widths: ["*"],
      body: [[{ text: "" }]],
    },
    layout: {
      hLineWidth: (i) => (i === 1 ? lineWidth : 0),
      vLineWidth: () => 0,
      hLineColor: () => color,
      vLineColor: () => color,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin,
  };
};

// =============================================================================
// CONTENT OBJECT GENERATION
// =============================================================================

/**
 * Processes a stack type content
 */
const processStackContent = (layout, data, staticData, jsonData) => {
  const { content, ...rest } = layout;

  if (!Array.isArray(content)) {
    return {};
  }

  const newContent = content.map((item) => {
    // Resolve value if it's an array path
    if (Array.isArray(item.value)) {
      item.value = resolveValue(item.value, staticData, jsonData);
    }

    if (item.type === "text") {
      const additionalProps = extractAdditionalProps(item, [
        "type",
        "value",
        "alignment",
        "style",
      ]);

      // Handle prefix
      if (item.prefix) {
        if (Array.isArray(item.prefix)) {
          item.prefix = resolveValue(item.prefix, staticData, jsonData);
        }
        item.value = item.prefix + (item.afterPrefix || "") + item.value;
      }

      // Handle suffix
      if (item.suffix) {
        if (Array.isArray(item.suffix)) {
          item.suffix = resolveValue(item.suffix, staticData, jsonData);
        }
        item.value = item.value + (item.beforeSuffix || "") + item.suffix;
      }

      return {
        text: item.value,
        alignment: item.alignment ?? "left",
        style: item.style !== null ? item.style : (layout.style ?? "normalText"),
        ...additionalProps,
      };
    }

    if (item.type === "image") {
      const imageProps = extractAdditionalProps(item, ["value", "type"]);
      return {
        image: item.value,
        ...imageProps,
      };
    }

    if (item.type === "table") {
      return tableObject(item, data, staticData);
    }

    return item;
  });

  return {
    stack: [...newContent],
    ...rest,
  };
};

/**
 * Processes a QR code type content
 */
const processQrContent = (layout, valueData) => {
  const qrContent = { qr: valueData };

  if (layout.foreground) qrContent.foreground = layout.foreground;
  if (layout.background) qrContent.background = layout.background;
  if (layout.fit) qrContent.fit = layout.fit;

  return qrContent;
};

/**
 * Processes an image type content
 */
const processImageContent = (layout, valueData) => {
  const imageProps = extractAdditionalProps(layout, ["value", "type"]);
  return {
    image: valueData,
    ...imageProps,
  };
};

/**
 * Processes an SVG type content
 */
const processSvgContent = (layout, valueData) => {
  const hasSignature =
    valueData && valueData.startsWith("data:image/svg+xml;base64,");
  const decodedSvg = hasSignature
    ? BufferObj.from(
        valueData.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString("utf-8")
    : null;

  const svgProps = extractAdditionalProps(layout, ["value", "type"]);
  return {
    svg: decodedSvg,
    ...svgProps,
  };
};

/**
 * Processes a text type content (default)
 */
const processTextContent = (layout, valueData, itemStyle) => {
  let processedValue = valueData;

  if (layout.format && layout.format.type === "date") {
    if (processedValue === null || processedValue === undefined) {
      processedValue = "";
    } else {
      processedValue = dayjs(processedValue).format(layout.format.value);
    }
  }

  const additionalProps = extractAdditionalProps(layout, [
    "type",
    "value",
    "alignment",
    "style",
  ]);

  return {
    text: processedValue,
    alignment: layout.alignment ?? "left",
    style: itemStyle !== null ? itemStyle : (layout.style ?? "normalText"),
    ...additionalProps,
  };
};

/**
 * Main function to generate content based on layout
 */
const object = (
  layout,
  data = null,
  staticData = null,
  isSolo = false,
  jsonData,
  tableSingleRowData = null,
  ignorePrefixAndSuffix = false
) => {
  // Check visibility condition
  if (layout.visible && evaluateCondition(layout.visible, data) === false) {
    return { text: "" };
  }

  let valueData = layout.value ?? "";
  let itemStyle = null;

  // Resolve prefix and suffix
  const prefixSuffixOptions = ignorePrefixAndSuffix
    ? {}
    : {
        prefix: layout.prefix ?? null,
        afterPrefix: layout.afterPrefix ?? null,
        suffix: layout.suffix ?? null,
        beforeSuffix: layout.beforeSuffix ?? null,
      };

  // Resolve prefix value
  if (prefixSuffixOptions.prefix && Array.isArray(prefixSuffixOptions.prefix)) {
    prefixSuffixOptions.prefix = resolveValue(
      prefixSuffixOptions.prefix,
      staticData,
      tableSingleRowData
    );
  }

  // Resolve suffix value
  if (prefixSuffixOptions.suffix && Array.isArray(prefixSuffixOptions.suffix)) {
    prefixSuffixOptions.suffix = resolveValue(
      prefixSuffixOptions.suffix,
      staticData,
      tableSingleRowData
    );
  }

  // Get value data based on context
  if (!isSolo) {
    valueData = data !== null ? data : layout.value;
  }

  // Resolve value if it's an array path
  if (Array.isArray(valueData)) {
    valueData = resolveValue(valueData, staticData, jsonData);
  }

  // Apply toFixed formatting
  valueData = formatToFixed(valueData, layout.toFixed);

  // Apply prefix and suffix
  if (!ignorePrefixAndSuffix) {
    if (prefixSuffixOptions.prefix) {
      valueData =
        prefixSuffixOptions.prefix +
        (prefixSuffixOptions.afterPrefix || "") +
        valueData;
    }
    if (prefixSuffixOptions.suffix) {
      valueData =
        valueData +
        (prefixSuffixOptions.beforeSuffix || "") +
        prefixSuffixOptions.suffix;
    }
  }

  // Handle conditional logic
  if (layout.condition) {
    const conditionResult = getValueBasedOnType(valueData, layout.condition);

    if (
      conditionResult === null ||
      conditionResult === undefined ||
      conditionResult === ""
    ) {
      if (layout.condition.isNUll?.type === "table") {
        return tableObject(layout.condition.isNUll, data, staticData);
      }
      valueData = layout.condition.isNUll?.value ?? "";
    } else {
      if (isString(conditionResult.value)) {
        valueData = conditionResult.value;
      }

      if (conditionResult.type === "table") {
        if (
          conditionResult.visible &&
          evaluateCondition(conditionResult.visible, data) === false
        ) {
          return null;
        }
        return tableObject(
          conditionResult,
          data ?? jsonData,
          staticData
        );
      }

      if (isObject(conditionResult.value)) {
        return object(conditionResult.value, null, staticData, true, jsonData);
      }

      if (conditionResult.style) {
        itemStyle = conditionResult.style;
      }
    }
  }

  // Handle different content types
  switch (layout.type) {
    case "stack":
      return processStackContent(layout, data, staticData, jsonData);

    case "qr":
      return processQrContent(layout, valueData);

    case "signature":
      return generateSignatureTable(layout, data ?? jsonData);

    case "image":
      return processImageContent(layout, valueData);

    case "svg":
      return processSvgContent(layout, valueData);

    default:
      return processTextContent(layout, valueData, itemStyle);
  }
};

// =============================================================================
// TABLE OBJECT GENERATION
// =============================================================================

/**
 * Processes table header row
 */
const processTableHeader = (layout, data, staticData, maxColumns) => {
  if (!layout.body.header) return null;

  let headerData = null;

  if (Array.isArray(layout.headerData)) {
    headerData = resolveValue(layout.headerData, staticData, data);
  } else if (isObject(layout.headerData)) {
    headerData = getValueFromPath(data, layout.headerData);
  }

  const headerRow = layout.body.header.map((cell, index) => {
    let cellData = null;

    // Resolve prefix
    let cellDataPrefix = cell.prefix ?? null;
    if (cellDataPrefix && Array.isArray(cellDataPrefix)) {
      cellDataPrefix = resolveValue(cellDataPrefix, staticData, data);
    }

    // Resolve suffix
    let cellDataSuffix = cell.suffix ?? null;
    if (cellDataSuffix && Array.isArray(cellDataSuffix)) {
      cellDataSuffix = resolveValue(cellDataSuffix, staticData, data);
    }

    // Get cell data
    if (headerData !== null) {
      const isHeaderObject = isObject(headerData[index]) || isObject(headerData);
      cellData = isHeaderObject
        ? getValueFromPath(headerData, cell.value)
        : headerData[index];
    } else if (Array.isArray(cell.value)) {
      cellData = resolveValue(cell.value, staticData, data);
    }

    // Apply prefix/suffix
    if (cellDataPrefix) {
      cellData = cellDataPrefix + (cell.afterPrefix || "") + cellData;
    }
    if (cellDataSuffix) {
      cellData = cellData + (cell.beforeSuffix || "") + cellDataSuffix;
    }

    return object(cell, cellData, staticData, false, data, null, true);
  });

  // Pad row to max columns
  while (headerRow.length < maxColumns) {
    headerRow.push({ text: "", style: "normalText" });
  }

  return headerRow;
};

/**
 * Processes a single table cell
 */
const processTableCell = (cell, rowData, data, staticData, hasRowData) => {
  if (cell.type === "table" && hasRowData && cell.rowData != null) {
    if (cell.visible && evaluateCondition(cell.visible, data) === false) {
      return null;
    }
    return tableObject(cell, rowData, staticData);
  }

  if (cell.type === "divider") {
    if (cell.visible && evaluateCondition(cell.visible, data) === false) {
      return { text: "" };
    }
    return buildDivider(cell);
  }

  if (Array.isArray(cell.value)) {
    const cellData = getValueFromPath(rowData, cell.value);
    if (cell.type === "table") {
      if (cell.visible && evaluateCondition(cell.visible, data) === false) {
        return null;
      }
      return tableObject(cell, data, staticData);
    }
    return object(cell, cellData, staticData, false, data, rowData);
  }

  if (cell.type === "table") {
    return tableObject(cell, rowData, staticData);
  }

  return object(cell, cell.value, staticData, false, data);
};

/**
 * Creates a table structure for the PDF
 */
const tableObject = (layout, data, staticData) => {
  const table = {};

  if (layout.widths) table.widths = layout.widths;
  if (layout.width) table.width = layout.width;

  if (!layout.body) {
    return null;
  }

  table.body = [];

  // Calculate max columns
  let maxColumns = layout.body.header ? layout.body.header.length : 0;
  for (const row of layout.body.rows) {
    maxColumns = Math.max(maxColumns, row.length);
  }

  // Process header
  const headerRow = processTableHeader(layout, data, staticData, maxColumns);
  if (headerRow) {
    table.body.push(headerRow);
  }

  // Get row data
  let rowData = null;
  if (layout.rowData != null) {
    rowData =
      layout.rowData === "$"
        ? getValueFromPath(staticData, layout.rowData)
        : getValueFromPath(data, layout.rowData);
  }

  // Filter empty rows if configured
  if (rowData !== null && layout.ignoreEmpty?.enable && layout.ignoreEmpty?.value) {
    rowData = rowData.filter(
      (row) =>
        !layout.ignoreEmpty.value.every((field) => {
          const fieldValue = getValueFromPath(row, [field]);
          return fieldValue === undefined || fieldValue === null || fieldValue === "";
        })
    );
  }

  // Process rows
  if (rowData !== null) {
    // When rowData exists, iterate and use layout.body.rows as template
    for (const row of rowData) {
      for (const templateRow of layout.body.rows) {
        const tableRow = templateRow.map((cell) =>
          processTableCell(cell, row, data, staticData, true)
        );

        while (tableRow.length < maxColumns) {
          tableRow.push({ text: "", style: "normalText" });
        }
        table.body.push(tableRow);
      }
    }
  } else {
    // No rowData - process rows directly
    for (const row of layout.body.rows) {
      const tableRow = row.map((cell) => {
        if (cell.type === "table") {
          if (cell.visible && evaluateCondition(cell.visible, data) === false) {
            return null;
          }
          return tableObject(cell, data, staticData);
        }
        if (cell.type === "divider") {
          if (cell.visible && evaluateCondition(cell.visible, data) === false) {
            return { text: "" };
          }
          return buildDivider(cell);
        }
        return object(cell, null, staticData, false, data);
      });

      while (tableRow.length < maxColumns) {
        tableRow.push({ text: "", style: "normalText" });
      }
      table.body.push(tableRow);
    }
  }

  // Return null if table is empty (only header or no rows)
  if (table.body.length <= (layout.body.header ? 1 : 0)) {
    return null;
  }

  // Set table properties
  table.headerRows = layout.headerRows ?? 1;
  if (layout.dontBreakRows) table.dontBreakRows = true;
  if (layout.keepWithHeaderRows) table.keepWithHeaderRows = layout.keepWithHeaderRows;

  const tempTable = { table };

  // Apply layout
  if (layout.layout) {
    tempTable.layout = getTableLayout(layout.layout);
  }

  // Apply margin
  if (Array.isArray(layout.margin) && layout.margin.length >= 4) {
    tempTable.margin = layout.margin;
  }

  // Copy additional properties
  const handledProps = [
    "type",
    "widths",
    "width",
    "body",
    "headerData",
    "rowData",
    "ignoreEmpty",
    "headerRows",
    "dontBreakRows",
    "keepWithHeaderRows",
    "layout",
    "margin",
  ];

  for (const prop in layout) {
    if (!handledProps.includes(prop)) {
      tempTable[prop] = layout[prop];
    }
  }

  return tempTable;
};

/**
 * Checks if table has one row, one cell, and that cell is only empty text
 */
const isTableEffectivelyEmpty = (tableDef) => {
  const t = tableDef?.table;
  if (!t?.body || t.body.length !== 1) return false;

  const row = t.body[0];
  if (!row?.length || row.length !== 1) return false;

  const cell = row[0];
  if (!cell) return true;

  const text = cell.text;
  const isEmptyText =
    text === "" ||
    text === undefined ||
    (typeof text === "string" && text.trim() === "");

  const hasOtherContent =
    cell.table ||
    cell.stack ||
    (Array.isArray(cell.columns) && cell.columns.length > 0) ||
    cell.image ||
    cell.canvas;

  return isEmptyText && !hasOtherContent;
};

// =============================================================================
// ARRAY PROCESSING
// =============================================================================

/**
 * Processes array type content recursively
 */
const processArray = (content, data, staticData) => {
  const rowData = getValueFromPath(data, content.rowData) || [];
  const definedArray = [];

  for (const item of rowData) {
    for (const itemContent of content.content) {
      if (itemContent.type === "array") {
        definedArray.push(processArray(itemContent, item, staticData));
      } else if (itemContent.type === "table") {
        const table = tableObject(itemContent, item, staticData);
        definedArray.push(table);
      }
    }
  }

  return definedArray;
};

// =============================================================================
// FOOTER PROCESSING
// =============================================================================

/**
 * Processes footer content and handles showOnlyOnLastPage logic
 */
const processFooterContent = (footerContent, currentPage, pageCount) => {
  if (!Array.isArray(footerContent) || footerContent.length === 0) {
    return footerContent;
  }

  for (const footer of footerContent) {
    if (footer?.table?.body) {
      processFooterTableBody(footer.table.body, currentPage, pageCount);
    }
    if (footer?.stack) {
      for (const item of footer.stack) {
        if (item?.table?.body) {
          processFooterTableBody(item.table.body, currentPage, pageCount);
        }
      }
    }
  }

  return footerContent;
};

/**
 * Processes table body for showOnlyOnLastPage cells
 */
const processFooterTableBody = (body, currentPage, pageCount) => {
  for (const bodyItem of body) {
    if (Array.isArray(bodyItem)) {
      for (const cell of bodyItem) {
        if (cell?.showOnlyOnLastPage && currentPage !== pageCount) {
          if (cell.text !== undefined) cell.text = "";
          if (cell.svg !== undefined) {
            cell.svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
          }
        }
      }
    }
  }
};

/**
 * Creates footer divider element
 */
const createFooterDivider = () => ({
  canvas: [
    {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 1000,
      y2: 0,
      lineWidth: 1,
      margin: [0, 0, 0, 0],
    },
  ],
  margin: [0, 0, 0, 0],
});

// =============================================================================
// MAIN PDF DEFINITION
// =============================================================================

/**
 * Main function to generate PDF document definition
 */
const pdfDefinition = (layout, data) => {
  try {
    // Initialize document definition
    const defaultFontSize = layout.setting.fontSize || 12;
    const defaultFontMargin = layout.setting.fontMargin ?? [0, 0, 0, 0];

    const docDefinition = {
      defaultStyle: {
        fontSize: defaultFontSize,
        margin: defaultFontMargin,
      },
      styles: {
        ...layout.styles,
        normalText: {
          fontSize: defaultFontSize,
          margin: defaultFontMargin,
          ...(layout.styles?.normalText || {}),
        },
      },
      pageOrientation: layout.setting.orientation ?? "portrait",
      pageSize: layout.setting.size ?? "LETTER",
      pageMargins: layout.setting.margin ?? [20, 60, 40, 60],
      content: [],
    };

    // Process header
    if (layout.header) {
      const headerObj = layout.header.contents.map((header) =>
        object(header, data, layout.static, true, data)
      );

      const col = { columns: headerObj };
      if (layout.header.margin) col.margin = layout.header.margin;

      docDefinition.header = col;
    }

    // Process body content
    if (layout.body) {
      for (const content of layout.body.content) {
        const processedContent = processBodyContent(content, data, layout);
        if (processedContent) {
          if (Array.isArray(processedContent)) {
            docDefinition.content.push(...processedContent);
          } else {
            docDefinition.content.push(processedContent);
          }
        }
      }
    }

    // Process footer
    if (layout.footer) {
      docDefinition.footer = createFooterFunction(layout, data);
    }

    return docDefinition;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

/**
 * Processes a single body content item
 */
const processBodyContent = (content, data, layout) => {
  // Check visibility
  if (content.visible && evaluateCondition(content.visible, data) === false) {
    return null;
  }

  switch (content.type) {
    case "table": {
      const table = tableObject(content, data, layout.static);
      return table && !isTableEffectivelyEmpty(table) ? table : null;
    }

    case "columns": {
      const columns = [];
      for (const column of content.contents) {
        if (column.visible && evaluateCondition(column.visible, data) === false) {
          continue;
        }

        if (column.type === "table") {
          const table = tableObject(column, data, layout.static, true, data);
          if (table) columns.push(table);
        } else if (column.type === "signature") {
          columns.push(generateSignatureTable(column, data));
        } else {
          columns.push(object(column, data, layout.static, true, data));
        }
      }

      const columnData = { columns };
      if (content.columnGap) columnData.columnGap = content.columnGap;
      if (content.width) columnData.width = content.width;

      return columnData;
    }

    case "signature":
      return generateSignatureTable(content, data);

    case "array":
      return processArray(content, data, layout);

    case "divider": {
      return buildDivider(content);
    }

    default:
      console.error("GOT UNKNOWN CONTENT TYPE ::", content.type, content);
      // throw new Error(`Unknown content type: ${content.type}`);
  }
};

/**
 * Creates the footer function for the PDF
 */
const createFooterFunction = (layout, data) => {
  return function (currentPage, pageCount) {
    // Generate footer content
    const footerContent = layout.footer.contents.map((footer) =>
      object(footer, data, layout.static, true, data)
    );

    // Process showOnlyOnLastPage logic
    processFooterContent(footerContent, currentPage, pageCount);

    const footerContentObj = [];
    const showDivider = layout.footer.showDivider === true;

    const footerStack = showDivider
      ? [createFooterDivider(), { columns: footerContent }]
      : [{ columns: footerContent }];

    footerContentObj.push({
      stack: footerStack,
      margin: layout.footer.margin || [0, 0, 0, 0],
    });

    // Add pagination
    if (layout.footer.showPageNumber) {
      const paginateTxt = {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        margin: [0, 10, 0, 0],
        fontSize: 9,
      };

      let leftFooterTable = null;
      if (layout.footer.leftFooter?.type === "table") {
        leftFooterTable = tableObject(
          layout.footer.leftFooter,
          data,
          layout.static
        );
      }

      footerContentObj[0].stack.push({
        columns: [
          leftFooterTable || {
            ...paginateTxt,
            text: "LEFT",
            alignment: "left",
          },
          paginateTxt,
        ],
      });
    }

    return footerContentObj;
  };
};

export default pdfDefinition;
