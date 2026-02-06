import dayjs from "dayjs";
import { Buffer } from "buffer";
import pixelWidth from "string-pixel-width";

const evaluateCondition = (conditionString, data) => {
  // Function to sanitize keys for use in Function constructor, required as keys not following JS var naming rules break the function
  const sanitizeKey = (key) => {
    // Replace hyphens and other special characters with underscores
    let sanitized = key.replace(/[^a-zA-Z0-9]/g, "_");
    // Add prefix if key starts with a number
    if (/^[0-9]/.test(sanitized)) {
      sanitized = "key_" + sanitized;
    }
    return sanitized;
  };

  // Create a sanitized version of the data object
  const sanitizedData = {};
  Object.entries(data).forEach(([key, value]) => {
    sanitizedData[sanitizeKey(key)] = value;
  });

  // Sanitize the condition string to use the sanitized keys
  let sanitizedCondition = conditionString;
  Object.keys(data).forEach((key) => {
    const sanitizedKey = sanitizeKey(key);
    if (key !== sanitizedKey) {
      sanitizedCondition = sanitizedCondition.replace(
        new RegExp(key, "g"),
        sanitizedKey
      );
    }
  });

  if (typeof conditionString !== "string" || conditionString.trim() === "") {
    return true; // Default to true if no valid condition is provided
  }

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
// Detect environment
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

// Ensure Buffer is available
const BufferObj = isNode ? global.Buffer : Buffer;
// Utility function to check if a variable is a string
function isString(variable) {
  return typeof variable === "string";
}
// Function to retrieve a value based on its type from an object
function getValueBasedOnType(input, obj) {
  try {
    // Check if the type in the object includes the input and return the appropriate value
    if (obj.type.includes(input)) {
      return obj[input] !== undefined ? obj[input] : input;
    }
    return null;
  } catch (error) {
    // Return an empty string if any error occurs
    return "";
  }
}
const generateSignatureTable = (content, data) => {
  // Utility function to get a nested value based on path
  let attendeeTypeValue = null; // Initialize attendee type value
  const getValueFromPath = (obj, path) => {
    return path.reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj
    );
  };

  // Function to decode base64-encoded SVG
  const decodeBase64Svg = (base64Data) => {
    if (base64Data.startsWith("data:image/svg+xml;base64,")) {
      const base64String = base64Data.replace("data:image/svg+xml;base64,", "");
      return Buffer.from(base64String, "base64").toString("utf-8");
    }
    return base64Data; // Return raw string if not base64-encoded
  };

  // Check if the attendees exist and have valid data
  const rowData = getValueFromPath(data, content.rowData) || [];
  
  // Support for minItemsPerRow and maxItemsPerRow
  // maxItemsPerRow: Maximum items before wrapping to next row
  // minItemsPerRow: Minimum columns per row (fill with empty cells if needed)
  const maxItemsPerRow = content.maxItemsPerRow || content.minItemsPerRow || 2;
  const minItemsPerRow = content.minItemsPerRow || maxItemsPerRow;
  // The table column count is the larger of min and max (typically they're equal)
  const columnsPerRow = Math.max(minItemsPerRow, maxItemsPerRow);
  
  // Whether to show the title header (default: true for backward compatibility)
  const showTitle = content.showTitle !== false;
  
  // Gap between signature boxes (default: 3)
  const boxGap = content.boxGap ?? 3;
  
  // Title margin (default: [0, 5, 0, 5] - bottom margin for spacing before signatures)
  const titleMargin = content.titleMargin ?? [0, 5, 0, 5];
  
  const tableBody = [];
  let currentRow = [];

  // Right margin to prevent overflow (same for title and signatures)
  // Set to 0 since font size adjustments now prevent overflow
  const overflowMargin = 0;
  
  // Title with divider line below
  const titleBoxObj = {
    stack: [
      {
        text: content.title ?? "Signatures",
        alignment: "center",
        bold: true,
        margin: [0, 0, 0, 0],
      },
      // Divider line below title
      {
        table: {
          widths: ["*"],
          body: [[{ text: "" }]],
        },
        layout: {
          hLineWidth: (i) => (i === 1 ? 0.5 : 0),
          vLineWidth: () => 0,
          hLineColor: () => "#cccccc",
        },
      },
    ],
    margin: [
      titleMargin[0] || 0,
      titleMargin[1] || 0,
      Math.max(titleMargin[2] || 0, overflowMargin),
      titleMargin[3] || 0,
    ],
  };

  // Helper function to create an empty placeholder cell (invisible - no box)
  const createEmptyCell = () => ({
    text: "",
  });

  // Helper function to fill row to minimum columns with empty cells
  const fillRowToMinColumns = (row) => {
    const filledRow = [...row];
    while (filledRow.length < columnsPerRow) {
      filledRow.push(createEmptyCell());
    }
    return filledRow;
  };

  // Helper function to adjust margins for a row
  // - First box: no left margin
  // - Middle boxes: left margin for gap
  // - Last actual signature box: no right margin
  const adjustRowMargins = (row) => {
    // Find the last actual signature (non-empty cell)
    let lastSignatureIndex = -1;
    for (let i = row.length - 1; i >= 0; i--) {
      if (row[i].table) {
        lastSignatureIndex = i;
        break;
      }
    }

    // Adjust margins for each cell
    row.forEach((cell, index) => {
      if (cell.table) {
        // It's a signature box
        const isFirst = index === 0;
        const isLast = index === lastSignatureIndex;
        
        // Calculate margins: [left, top, right, bottom]
        const leftMargin = isFirst ? 0 : boxGap / 2;
        const rightMargin = isLast ? 0 : boxGap / 2;
        
        cell.margin = [leftMargin, 0, rightMargin, boxGap];
      }
    });

    return row;
  };

  // If no attendees exist, return placeholder
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
    
    return {
      stack: emptyContent,
    };
  }

  // Iterate over attendees and create signature cells
  rowData.forEach((attendee) => {
    let signatureData = getValueFromPath(attendee, content.signature) || ""; // Get SVG data

    // Decode base64 if applicable
    signatureData = decodeBase64Svg(signatureData);

    // Validate and provide fallback for SVG
    if (!signatureData.startsWith("<svg")) {
      signatureData = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">
        <rect width="100" height="50" fill="#ccc"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-size="10">
          Invalid SVG
        </text>
      </svg>`;
    }

    // Name and optional attendeeType
    const displayName =
      getValueFromPath(attendee, content.displayNames) || "Unknown"; // Get attendee name

    const isAttendeeTypeEnabled = !!content.attendeeType;
    if (isAttendeeTypeEnabled === true) {
      attendeeTypeValue = attendee.attendeeType || null;
    }

    // Calculate font size based on name length to keep it on single line
    // Reduce font size more aggressively for longer names to prevent overflow
    const baseFontSize = 10.5;
    const minFontSize = 8;
    const maxNameLength = 15;
    const nameFontSize = displayName.length > maxNameLength 
      ? Math.max(minFontSize, baseFontSize - Math.floor((displayName.length - maxNameLength) / 3))
      : baseFontSize;
    console.log("NAME FONT SIZE ::", nameFontSize);

    // Fixed heights for consistent box sizing
    const signatureRowHeight = 50;
    const nameRowHeight = 14;
    const totalBoxHeight = signatureRowHeight + nameRowHeight + 4; // +4 for padding

    // Calculate vertical centering margin for name
    const nameVerticalMargin = Math.max(0, Math.floor((nameRowHeight - nameFontSize) / 2));

    // Helper function to create SVG with rotated text (90 degrees counter-clockwise)
    const createRotatedTextSvg = (text, height, fontSize = 8) => {
      const svgWidth = 16; // Fixed width for the rotated text column
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

    // Build the signature cell based on whether attendeeType is enabled
    let signatureCell;

    if (isAttendeeTypeEnabled && attendeeTypeValue) {
      // Layout: attendeeType on left of signature only, name spans full width at bottom
      const rotatedSvg = createRotatedTextSvg(attendeeTypeValue, signatureRowHeight);

      signatureCell = {
        table: {
          headerRows: 0,
          dontBreakRows: true,
          widths: [18, "*"], // Narrow left column for rotated text
          body: [
            [
              // Left column: rotated attendeeType (only in signature row)
              {
                svg: rotatedSvg,
                fit: [16, signatureRowHeight],
                alignment: "center",
              },
              // Right column: signature (centered using fit with full row height)
              {
                svg: signatureData,
                width: 100,
                height: 50,
                alignment: "center",
                margin: [0, 2, 0, 2],
              },
            ],
            [
              // Name spans full width (colSpan: 2)
              {
                text: displayName,
                alignment: "center",
                fontSize: nameFontSize,
                color: "#545454",
                noWrap: true,
                margin: [0, nameVerticalMargin, 0, 0],
                colSpan: 2,
              },
              {}, // Empty cell for colSpan
            ],
          ],
          heights: [signatureRowHeight, nameRowHeight],
        },
        // Each box has its own border - no vertical line between attendeeType and signature
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
    } else {
      // Original layout: signature on top, name below (no attendeeType)
      const cellBody = [
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
      ];

      signatureCell = {
        table: {
          headerRows: 0,
          dontBreakRows: true,
          widths: ["*"],
          heights: [signatureRowHeight, nameRowHeight],
          body: cellBody,
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
    }

    // Add cell to current row
    currentRow.push(signatureCell);

    // If the row reaches maxItemsPerRow, fill and push to tableBody
    if (currentRow.length === maxItemsPerRow) {
      tableBody.push(fillRowToMinColumns(currentRow));
      currentRow = []; // Reset row
    }
  });

  // Handle remaining items in the last incomplete row
  if (currentRow.length > 0) {
    // Fill the remaining row to columnsPerRow with empty cells
    tableBody.push(fillRowToMinColumns(currentRow));
  }

  // Build the result stack
  const resultStack = [];

  // Add title if enabled (in a bordered box)
  if (showTitle) {
    resultStack.push(titleBoxObj);
  }

  // Add the signatures table (outer table with no borders - boxes are standalone)
  if (tableBody.length > 0) {
    resultStack.push({
      table: {
        widths: Array(columnsPerRow).fill("*"),
        body: tableBody,
        headerRows: 0,
        dontBreakRows: true,
      },
      // Outer table has no borders - use padding for gaps between cells
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: (i) => (i === 0 ? 0 : boxGap / 2),
        paddingRight: (i, node) => (i === node.table.widths.length - 1 ? 0 : boxGap / 2),
        paddingTop: () => 0,
        paddingBottom: () => boxGap,
      },
      // Right margin to match title and prevent border overflow
      margin: [0, 0, overflowMargin, 0],
    });
  }

  return {
    stack: resultStack,
    // Ensure the signature section stays within page bounds
    margin: [0, 0, 0, 0],
    width: "100%",
  };
};

// Main function to generate content based on layout
const object = (
  layout,
  data = null,
  staticData = null,
  isSolo = false,
  jsonData,
  tableSingleRowData = null,
  ignorePrefixAndSuffix = false
) => {
  if (layout.visible && evaluateCondition(layout.visible, data) === false) {
    return {
      text: "",
    };
  }

  let valueData = layout.value ?? "";
  let valueDataPrefix = ignorePrefixAndSuffix ? null : (layout.prefix ?? null);
  let valueDataAfterPrefix = ignorePrefixAndSuffix
    ? null
    : (layout.afterPrefix ?? null);
  // if prefix is an array, check if it is a static data or a table single row data
  if (valueDataPrefix) {
    let isValArray = Array.isArray(valueDataPrefix);
    if (isValArray) {
      if (valueDataPrefix[0] === "$") {
        const removeFirst = valueDataPrefix.slice(1);
        valueDataPrefix = getValueFromPath(staticData, removeFirst);
      } else {
        if (tableSingleRowData) {
          valueDataPrefix = getValueFromPath(
            tableSingleRowData,
            valueDataPrefix
          );
        }
      }
    }
  }

  let valueDataSuffix = ignorePrefixAndSuffix ? null : (layout.suffix ?? null);
  let valueDataBeforeSuffix = ignorePrefixAndSuffix
    ? null
    : (layout.beforeSuffix ?? null);
  // if suffix is an array, check if it is a static data or a table single row data
  if (valueDataSuffix) {
    let isValArray = Array.isArray(valueDataSuffix);
    if (isValArray) {
      if (valueDataSuffix[0] === "$") {
        const removeFirst = valueDataSuffix.slice(1);
        valueDataSuffix = getValueFromPath(staticData, removeFirst);
      } else {
        if (tableSingleRowData) {
          valueDataSuffix = getValueFromPath(
            tableSingleRowData,
            valueDataSuffix
          );
        }
      }
    }
  }
  let valueDataToFixed = layout.toFixed || 0;

  let itemStyle = null;

  if (isSolo === false) {
    if (data !== null) {
      valueData = data;
    } else {
      valueData = layout.value;
    }
  }

  const checkHeaderArray = Array.isArray(valueData);
  if (checkHeaderArray) {
    if (valueData[0] === "$") {
      const removeFirst = valueData.slice(1);
      valueData = getValueFromPath(staticData, removeFirst);
    } else {
      valueData = getValueFromPath(jsonData, valueData);
    }
  }
  // if the value is a decimal, format it to 2 decimal places
  if (valueData && valueDataToFixed > 0) {
    try {
      if (valueData && typeof valueData === "string") {
        valueData = parseFloat(valueData);
      }
      valueData = valueData.toFixed(valueDataToFixed);
    } catch (error) {}
  }
  // if there is a prefix, add it to the value
  if (valueDataPrefix) {
    valueData = valueDataPrefix + (valueDataAfterPrefix || "") + valueData;
  }
  // if there is a suffix, add it to the value
  if (valueDataSuffix) {
    valueData = valueData + (valueDataBeforeSuffix || "") + valueDataSuffix;
  }

  if (layout.condition) {
    let obj = getValueBasedOnType(valueData, layout.condition);
    if (obj === null || obj === undefined || obj === "") {
      if (layout.condition.isNUll && layout.condition.isNUll.type === "table") {
        const table = tableObject(layout.condition.isNUll, data, staticData);
        return table;
      }
      valueData = layout.condition.isNUll ? layout.condition.isNUll.value : "";
    } else if (obj !== undefined && obj !== null) {
      if (isString(obj.value)) {
        valueData = obj.value;
      }

      if (obj.type === "table") {
        if (obj.visible && evaluateCondition(obj.visible, data) === false) {
          return null;
        }
        const table = tableObject(
          obj,
          // if data is null or undefined, use jsonData
          data == null || data == undefined ? jsonData : data,
          staticData
        );
        return table;
      } else {
        const checkObject2 = checkObject(obj.value);
        if (checkObject2) {
          const tempObj = object(obj.value, null, staticData, true, jsonData);
          return tempObj;
        }

        if (obj.style) {
          itemStyle = obj.style;
        }
      }
    }
  }
  if (layout.type === "stack") {
    const { content, ...rest } = layout; // Extract content, keep the rest

    const contentArray = Array.isArray(content);
    if (!contentArray) {
      return {};
    }
    const newContent = content.map((item) => {
      const isValArray = Array.isArray(item.value);
      if (isValArray) {
        if (item.value[0] === "$") {
          const removeFirst = item.value.slice(1);
          item.value = getValueFromPath(staticData, removeFirst);
        } else {
          item.value = getValueFromPath(jsonData, item.value);
        }
      }
      if (item.type === "text") {
        const additionalProps = Object.entries(item).reduce(
          (acc, [key, value]) => {
            if (!["type", "value", "alignment", "style"].includes(key)) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        if (item.prefix) {
          const isValArray = Array.isArray(item.prefix);
          if (isValArray) {
            if (item.prefix[0] === "$") {
              const removeFirst = item.prefix.slice(1);
              item.prefix = getValueFromPath(staticData, removeFirst);
            } else {
              item.prefix = getValueFromPath(jsonData, item.prefix);
            }
          }
          item.value = item.prefix + (item.afterPrefix || "") + item.value;
        }
        if (item.suffix) {
          const isValArray = Array.isArray(item.suffix);
          if (isValArray) {
            if (item.suffix[0] === "$") {
              const removeFirst = item.suffix.slice(1);
              item.suffix = getValueFromPath(staticData, removeFirst);
            } else {
              item.suffix = getValueFromPath(jsonData, item.suffix);
            }
          }
          item.value = item.value + (item.beforeSuffix || "") + item.suffix;
        }
        return {
          text: item.value,
          alignment: item.alignment ?? "left",
          style:
            item.style !== null ? item.style : (layout.style ?? "normalText"),
          ...additionalProps,
        };
      } else if (item.type === "image") {
        console.log("GOT IMAGE TYPE :", item);
        // default
        let imageContent = {
          image: item.value,
        };

        // Copy all image properties except width, height, value, type
        const imageProps = Object.entries(item).reduce((acc, [key, value]) => {
          if (!["value", "type"].includes(key)) {
            acc[key] = value;
          }
          return acc;
        }, {});
        imageContent = {
          ...imageContent,
          ...imageProps,
        };
        return imageContent;
      } else if (item.type === "table") {
        const tableContent = tableObject(item, data, staticData);
        return tableContent;
      }
    });

    const stackContent = {
      stack: [...newContent],
      ...rest, // Spread remaining properties
    };

    return stackContent;
  }

  if (layout.type === "qr") {
    const qrContent = {
      qr: valueData,
    };
    if (layout.foreground) qrContent.foreground = layout.foreground;
    if (layout.background) qrContent.background = layout.background;
    if (layout.fit) qrContent.fit = layout.fit;
    return qrContent;
  }
  if (layout.type == "signature") {
    return generateSignatureTable(
      layout,
      data == null || data == undefined ? jsonData : data
    );
  }

  if (layout.type === "image") {
    console.log("GOT IMAGE TYPE ::", layout);
    // default
    let imageContent = {
      image: valueData,
    };

    // Copy all image properties except width, height, value, type
    const imageProps = Object.entries(layout).reduce((acc, [key, value]) => {
      if (!["value", "type"].includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    imageContent = {
      ...imageContent,
      ...imageProps,
    };
    return imageContent;
  } else if (layout.type === "svg") {
    const hasSignature =
      valueData && valueData.startsWith("data:image/svg+xml;base64,");
    const decodedSvg = hasSignature
      ? BufferObj.from(
          valueData.replace("data:image/svg+xml;base64,", ""),
          "base64"
        ).toString("utf-8")
      : null;
    let svgContent = {
      svg: decodedSvg,
    };
    // Copy all image properties except width, height, value, type
    const svgProps = Object.entries(layout).reduce((acc, [key, value]) => {
      if (!["value", "type"].includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    return {
      ...svgContent,
      ...svgProps,
    };
  } else {
    if (layout.format && layout.format.type === "date") {
      if (valueData === null || valueData === undefined) {
        valueData = "";
      } else {
        valueData = dayjs(valueData).format(layout.format.value);
      }
    }
    // Copy everything from layout except type, value, alignment and style
    const additionalProps = Object.entries(layout).reduce(
      (acc, [key, value]) => {
        if (!["type", "value", "alignment", "style"].includes(key)) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );
    return {
      text: valueData,
      alignment: layout.alignment ?? "left",
      style: itemStyle !== null ? itemStyle : (layout.style ?? "normalText"),
      ...additionalProps,
    };
  }
};

// Function to get a nested value from an object based on a path
function getValueFromPath(obj, path) {
  // Use reduce to traverse the object and get the value at the specified path
  let result = path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
  // if the result is a string and does not contain "base64", then remove the html tags and whitespace
  if (typeof result === "string" && !result.slice(0, 50).includes("base64")) {
    result = result
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return result === null || result === undefined ? "" : result;
}

// Utility function to check if a variable is an object (excluding arrays)
function checkObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

// Build a horizontal divider for pdfmake.
// Uses a 1-cell table with bottom border so it spans full width and thickness is reliable
// (canvas line can have lineWidth ignored when lineColor is set in some pdfmake versions).
// content: { margin?, lineWidth?, color?, useCanvas? } - all optional
// useCanvas: true = use canvas line (fixed width); otherwise table-based (full width)
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

  // Table-based divider: full width, reliable line thickness (only bottom line drawn)
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
    },
    margin,
  };
};

// Function to create a table structure for the PDF
const tableObject = (layout, data, staticData) => {
  const table = {};
  if (layout.widths) table.widths = layout.widths;
  if (layout.width) table.width = layout.width;

  if (layout.body) {
    table.body = [];
    let maxColumns = layout.body.header ? layout.body.header.length : 0;
    for (const row of layout.body.rows) {
      maxColumns = Math.max(maxColumns, row.length);
    }

    if (layout.body.header) {
      let headerData = null;
      const checkHeaderArray = Array.isArray(layout.headerData);
      if (checkHeaderArray) {
        if (layout.headerData[0] === "$") {
          const removeFirst = layout.headerData.slice(1);
          headerData = getValueFromPath(staticData, removeFirst);
        } else {
          headerData = getValueFromPath(data, layout.headerData);
        }
      }
      const checkObject2 = checkObject(layout.headerData);
      if (checkObject2) {
        headerData = getValueFromPath(data, layout.headerData);
      }

      const headerRow = layout.body.header.map((cell, index) => {
        let cellData = null;
        let cellDataPrefix = cell.prefix ?? null;
        let cellDataAfterPrefix = cell.afterPrefix ?? null;
        let cellDataBeforeSuffix = cell.beforeSuffix ?? null;
        let cellDataSuffix = cell.suffix ?? null;
        // if prefix is an array, check if it is a static data or a table single row data
        if (cellDataPrefix) {
          let isValArray = Array.isArray(cellDataPrefix);
          if (isValArray) {
            if (cellDataPrefix[0] === "$") {
              const removeFirst = cellDataPrefix.slice(1);
              cellDataPrefix = getValueFromPath(staticData, removeFirst);
            } else {
              if (data) {
                cellDataPrefix = getValueFromPath(data, cellDataPrefix);
              }
            }
          }
        }
        // if suffix is an array, check if it is a static data or a table single row data
        if (cellDataSuffix) {
          let isValArray = Array.isArray(cellDataSuffix);
          if (isValArray) {
            if (cellDataSuffix[0] === "$") {
              const removeFirst = cellDataSuffix.slice(1);
              cellDataSuffix = getValueFromPath(staticData, removeFirst);
            } else {
              if (data) {
                cellDataSuffix = getValueFromPath(data, cellDataSuffix);
              }
            }
          }
        }
        if (headerData !== null) {
          const isObject =
            checkObject(headerData[index]) || checkObject(headerData);
          if (isObject) {
            cellData = getValueFromPath(headerData, cell.value);
          } else {
            cellData = headerData[index];
          }
        } else {
          const isArray = Array.isArray(cell.value);
          if (isArray) {
            if (cell.value[0] === "$") {
              const removeFirst = cell.value.slice(1);
              cellData = getValueFromPath(staticData, removeFirst);
            } else {
              cellData = getValueFromPath(data, cell.value);
            }
          }
        }
        if (cellDataPrefix) {
          cellData = cellDataPrefix + (cellDataAfterPrefix || "") + cellData;
        }
        if (cellDataSuffix) {
          cellData = cellData + (cellDataBeforeSuffix || "") + cellDataSuffix;
        }
        return object(cell, cellData, staticData, false, data, null, true);
      });
      while (headerRow.length < maxColumns) {
        headerRow.push({ text: "", style: "normalText" });
      }
      table.body.push(headerRow);
    }

    let rowData = null;
    if (layout.rowData !== undefined && layout.rowData !== null) {
      if (layout.rowData === "$") {
        rowData = getValueFromPath(staticData, layout.rowData);
      } else {
        rowData = getValueFromPath(data, layout.rowData);
      }
    }

    if (rowData !== null) {
      if (layout.ignoreEmpty?.enable && layout.ignoreEmpty?.value) {
        console.log("IGNORE EMPTY ::", layout.ignoreEmpty);
        console.log("LAYOUT ::", layout);
        rowData = rowData.filter(
          (row) =>
            !layout.ignoreEmpty.value.every((field) => {
              const fieldValue = getValueFromPath(row, [field]);
              return (
                fieldValue === undefined ||
                fieldValue === null ||
                fieldValue === ""
              );
            })
        );
      }

      // When rowData exists, iterate over rowData and use layout.body.rows as template
      for (const row of rowData) {
        for (const _row of layout.body.rows) {
          // When rowData exists, layout.body.rows contains individual cell objects
          // We need to create a table row from these cell objects
          const tableRow = _row.map((cell, index) => {
            let cellData = null;
            if (
              cell.type === "table" &&
              rowData !== null &&
              cell.rowData !== undefined &&
              cell.rowData !== null
            ) {
              console.log("CELL ::", cell);
              if (
                cell.visible &&
                evaluateCondition(cell.visible, data) === false
              ) {
                return null;
              }
              return tableObject(cell, row, staticData);
            } else if (cell.type === "divider") {
              // Handle divider type in table cells with rowData
              if (cell.visible && evaluateCondition(cell.visible, data) === false) {
                return { text: "" };
              }
              return buildDivider(cell);
            } else {
              const isArray = Array.isArray(cell.value);
              if (isArray) {
                cellData = getValueFromPath(row, cell.value);
                if (cell.type === "table") {
                  if (
                    cell.visible &&
                    evaluateCondition(cell.visible, data) === false
                  ) {
                    return null;
                  }
                  return tableObject(cell, data, staticData);
                } else {
                  return object(cell, cellData, staticData, false, data, row);
                }
              } else {
                if (cell.type === "table") {
                  return tableObject(cell, row, staticData);
                } else {
                  cellData = cell.value;
                  return object(cell, cellData, staticData, false, data);
                }
              }
            }
          });

          while (tableRow.length < maxColumns) {
            tableRow.push({ text: "", style: "normalText" });
          }
          table.body.push(tableRow);
        }
      }
    } else {
      for (const row of layout.body.rows) {
        const tableRow = row.map((cell, index) => {
          if (cell.type === "table") {
            if (
              cell.visible &&
              evaluateCondition(cell.visible, data) === false
            ) {
              return null;
            }
            return tableObject(cell, data, staticData);
          } else if (cell.type === "divider") {
            // Handle divider type in table cells
            if (cell.visible && evaluateCondition(cell.visible, data) === false) {
              return { text: "" };
            }
            return buildDivider(cell);
          } else {
            return object(cell, null, staticData, false, data);
          }
        });

        while (tableRow.length < maxColumns) {
          tableRow.push({ text: "", style: "normalText" });
        }
        table.body.push(tableRow);
      }
    }
  }

  if (table.body.length <= (layout.body.header ? 1 : 0)) {
    return null;
  }

  if (layout.headerRows !== undefined) {
    table.headerRows = layout.headerRows;
  } else {
    table.headerRows = 1;
  }
  if (layout.dontBreakRows) {
    table.dontBreakRows = true;
  }
  if (layout.keepWithHeaderRows) {
    table.keepWithHeaderRows = layout.keepWithHeaderRows;
  }

  let tempTable = { table: table };
  if (layout.layout) {
    if (layout.layout === "noBorders") {
      // pdfmake merges named layouts with defaultLayout. Override with explicit noBorders + normal cell padding.
      tempTable.layout = {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      };
    } else if (layout.layout === "outside") {
      tempTable.layout = {
        hLineWidth: function (i, node) {
          return i === 0 || i === node.table.body.length ? 1 : 0;
        },
        vLineWidth: function (i, node) {
          return i === 0 || i === node.table.widths.length ? 1 : 0;
        },
        hLineColor: function (i, node) {
          return "black";
        },
        vLineColor: function (i, node) {
          return "black";
        },
        paddingLeft: function (i, node) {
          return 0;
        },
        paddingRight: function (i, node) {
          return 0;
        },
        paddingTop: function (i, node) {
          return 0;
        },
        paddingBottom: function (i, node) {
          return 0;
        },
      };
    } else if (layout.layout === "onlyVerticalLinesWithClosedBorders") {
      tempTable.layout = {
        hLineWidth: function (i, node) {
          return i === 0 || i === 1 || i === node.table.body.length
            ? 1
            : node.onlyVerticalLinesWithClosedBorders_extra_row_height !=
                  undefined &&
                node.onlyVerticalLinesWithClosedBorders_extra_row_height != null
              ? node.onlyVerticalLinesWithClosedBorders_extra_row_height
              : 0.5; // Horizontal lines for header and bottom
        },
        vLineWidth: function (i, node) {
          return 1; // All vertical lines
        },
        vLineColor: function (i, node) {
          return "black";
        },
        hLineColor: function (i, node) {
          return i === 0 || i === 1 || i === node.table.body.length
            ? "black"
            : node.onlyVerticalLinesWithClosedBorders_extra_row_color !=
                  undefined &&
                node.onlyVerticalLinesWithClosedBorders_extra_row_color != null
              ? node.onlyVerticalLinesWithClosedBorders_extra_row_color
              : "lightgray";
        },
        paddingLeft: function () {
          return 0;
        },
        paddingRight: function (i, node) {
          return 0;
        },
        paddingTop: function (i, node) {
          return 0;
        },
        paddingBottom: (i, node) => {
          // This function determines the bottom padding for each row in the table
          const DEFAULT_PADDING = 0;

          // For the last row in the table
          if (i === node.table.body.length - 1) {
            // Get the current position information for the last element
            const currentPosition = node.positions[node.positions.length - 1];
            // Get text content and font size
            const text = node.table.body[node.table.body.length - 1][0].text;
            var width = pixelWidth(text, { size: 10 });
            var lines = Math.ceil(width / 250);
            // Get how far down the page the current element is
            const currentHeight = currentPosition.top;
            let paddingBottom =
              currentPosition.pageInnerHeight +
              (280 - currentHeight) -
              lines * 10;
            // custom logic to handle spacing if it goes to negative
            paddingBottom =
              paddingBottom < 0 ? 280 - paddingBottom : paddingBottom;
            // Return this space as padding to fill gap to bottom of page
            return paddingBottom > 300 ? 300 : paddingBottom;
          }

          // For all other rows, use the default padding of 2
          return DEFAULT_PADDING;
        },
      };
    } else {
      tempTable.layout = layout.layout;
    }
  }
  // Apply table-level margin [left, top, right, bottom] for spacing above/below the table
  if (
    Array.isArray(layout.margin) &&
    layout.margin.length >= 4
  ) {
    tempTable.margin = layout.margin;
  }
  // Add any additional properties from layout that haven't been handled
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

/** True if table has one row, one cell, and that cell is only empty text (e.g. conditional content that didn't render). */
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

const pdfDefinition = (layout, data) => {
  try {
    //temp remove fonts
    console.log("LAYOUT SETTING ::", layout.setting);
    // Initialize document definition with styles
    let docDefinition = {
      styles: {
        ...layout.styles,
        normalText: {
          fontSize: layout.setting.fontSize || 12, // Use fontSize from layout.setting, default to 12
          margin: layout.setting.fontMargin ?? [0, 0, 0, 0], // No default vertical space; set setting.fontMargin (e.g. [0,5,0,5]) to add spacing
          ...(layout.styles && layout.styles.normalText ? layout.styles.normalText : {})
        },
      },
      pageOrientation: layout.setting.orientation ?? "portrait", // Set page orientation, default to portrait
      pageSize: layout.setting.size ?? "LETTER", // Set page size, default to LETTER
      pageMargins: layout.setting.margin ?? [20, 60, 40, 60], // Set page margins, default values
    };

    console.log("DOC DEFINITION ::", docDefinition);

    // Handle document header if specified in layout
    if (layout.header) {
      let headerObj = [];
      for (const header of layout.header.contents) {
        headerObj.push(object(header, data, layout.static, true, data)); // Generate header content
      }
      const col = {
        columns: headerObj, // Create columns for header content
      };
      if (layout.header.margin) col.margin = layout.header.margin; // Apply header margin if specified

      docDefinition.header = col; // Set document header
    }

    docDefinition.content = []; // Initialize document content array
    if (layout.body) {
      for (const content of layout.body.content) {
        if (content.type === "table") {
          if (content.visible)
            if (evaluateCondition(content.visible, data) === false) {
              continue;
            }

          const table = tableObject(content, data, layout.static);
          console.log("TABLE ::", table);

          if (table && !isTableEffectivelyEmpty(table)) {
            docDefinition.content.push(table);
          }
        } else if (content.type === "columns") {
          if (content.visible)
            if (evaluateCondition(content.visible, data) === false) continue;
          const columns = [];
          for (const column of content.contents) {
            if (column.type === "table") {
              if (column.visible)
                if (evaluateCondition(column.visible, data) === false) {
                  continue;
                }
              const table = tableObject(
                column,
                data,
                layout.static,
                true,
                data
              );
              if (table) {
                columns.push(table);
              }
              //columns.push(tableObject(column, data, layout.static, true, data)); // Add table column
            } else if (column.type === "signature") {
              const signatureTable = generateSignatureTable(column, data); // Generate signature table
              columns.push(signatureTable); // Add signature table to columns
            } else {
              columns.push(object(column, data, layout.static, true, data)); // Add regular column content
            }
          }
          const columnData = {
            columns: columns, // Create columns for body content
          };
          if (content.columnGap) columnData.columnGap = content.columnGap; // Apply column gap if defined
          if (content.width) columnData.width = content.width; // Set column width if specified

          docDefinition.content.push(columnData); // Add columns to document content
        } else if (content.type === "signature") {
          const signatureTable = generateSignatureTable(content, data); // Generate signature table
          docDefinition.content.push(signatureTable); // Add signature table to document content
        } else if (content.type === "array") {
          const arrayData = processArray(content, data, layout);
          docDefinition.content.push(arrayData);
        } else if (content.type === "divider") {
          console.log("DIVIDER ::", content);
          if (content.visible && evaluateCondition(content.visible, data) === false) {
            continue;
          }
          const divider = buildDivider(content);
          if (divider) {
            docDefinition.content.push(divider);
          }
        } else {
          console.error("GOT UNKNOWN CONTENT TYPE ::", content.type, content);
          throw new Error(`Unknown content type: ${content.type}`);
        }
      }
    }

    // Handle document footer if specified in layout
    if (layout.footer) {
      docDefinition.footer = function (currentPage, pageCount) {
        // pre build footer content
        let footerContent = [];

        // // Generate footer content first
        for (const footer of layout.footer.contents) {
          footerContent.push(object(footer, data, layout.static, true, data)); // Generate footer content
        }

        if (Array.isArray(footerContent) && footerContent.length > 0) {
          for (const footer of footerContent) {
            if (
              footer &&
              typeof footer === "object" &&
              Array.isArray(footer.stack)
            ) {
              for (const item of footer.stack) {
                if (
                  item &&
                  typeof item === "object" &&
                  item.table &&
                  Array.isArray(item.table.body)
                ) {
                  for (const bodyItem of item.table.body) {
                    if (Array.isArray(bodyItem)) {
                      for (const cell of bodyItem) {
                        if (
                          cell &&
                          cell.showOnlyOnLastPage &&
                          currentPage != pageCount
                        ) {
                          if (cell.text) cell.text = ""; // Set text to an empty string
                          if (cell.svg)
                            cell.svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`; // Set svg to an empty string
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        let footerContentObj = [];

        // // Add divider above footer by default unless explicitly set to false
        const showDivider = layout.footer.showDivider == true;
        if (showDivider) {
          footerContentObj.push({
            stack: [
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 1000, // Full page width
                    y2: 0,
                    lineWidth: 1,
                    margin: [0, 0, 0, 0], // Remove any margin
                  },
                ],
                margin: [0, 0, 0, 0], // Remove margin from canvas container
              },
              {
                columns: footerContent,
              },
            ],
            margin: layout.footer.margin ? layout.footer.margin : [0, 0, 0, 0],
          });
        } else {
          footerContentObj.push({
            stack: [
              {
                columns: footerContent,
              },
            ],
            margin: layout.footer.margin ? layout.footer.margin : [0, 0, 0, 0],
          });
        }

        // for pagination indicator
        let paginateTxt = {
          text: "",
          alignment: "right",
          margin: [0, 10, 0, 0],
          fontSize: 9,
        };
        // add page number
        if (layout.footer.showPageNumber) {
          paginateTxt.text =
            "Page " + currentPage.toString() + " of " + pageCount;
          let leftFooterTable = null;
          if (layout.footer.leftFooter) {
            if (layout.footer.leftFooter.type === "table") {
              leftFooterTable = tableObject(
                layout.footer.leftFooter,
                data,
                layout.static
              );
            }
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
    }
    return docDefinition;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

const processArray = (content, data, staticData) => {
  const rowData = getValueFromPath(data, content.rowData) || [];
  let definedArray = [];
  for (let i = 0; i < rowData.length; i++) {
    const item = rowData[i];
    const contentArray = content.content;
    for (let j = 0; j < contentArray.length; j++) {
      const itemContent = contentArray[j];
      if (itemContent.type === "array") {
        const arrayData = processArray(itemContent, item, staticData);
        definedArray.push(arrayData);
      } else if (itemContent.type === "table") {
        const table = tableObject(itemContent, item, staticData);
        definedArray.push(table);
      }
    }
  }
  return definedArray;
};
export default pdfDefinition;
