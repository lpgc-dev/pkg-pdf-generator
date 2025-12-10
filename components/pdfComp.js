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
  const itemsPerRow = content.itemsPerRow || 2; // Default to 2 items per row
  const tableBody = [];
  let currentRow = [];

  const titleTextObj = {
    text: content.title ?? "Signatures", // Default title if not provided
    alignment: "center",
    bold: true,
    margin: [0, 2, 0, 2],
  };

  // Title with a border (no bottom border)
  const titleWithBorder = {
    table: {
      dontBreakRows: true, // Keep title & table content from splitting row by row
      headerRows: 0,
      widths: ["*"], // Full width
      body: [[titleTextObj]],
    },
    layout: {
      hLineWidth: (i) => (i === 0 ? 1 : 0), // Top horizontal line only
      vLineWidth: () => 1, // Vertical lines
      hLineColor: () => "#000000", // Horizontal line color
      vLineColor: () => "#000000", // Vertical line color
    },
  };

  // If no attendees exist, return only the title with an empty table
  if (!Array.isArray(rowData) || rowData.length === 0) {
    return {
      // unbreakable so the title & placeholder aren't split
      unbreakable: true,
      stack: [
        titleWithBorder,
        {
          table: {
            widths: Array(itemsPerRow).fill("*"), // Default column widths
            body: [
              [
                {
                  text: content.placeholder ?? "No signatures available",
                  colSpan: itemsPerRow,
                  alignment: "center",
                },
              ],
            ],
            headerRows: 0,
            layout: "noBorders", // Optional: remove borders for the empty state
          },
        },
      ],
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

    // Build the cell
    const signatureCell = {
      layout: "noBorders",
      table: {
        headerRows: 0,
        dontBreakRows: true,
        headerRows: 0,
        widths: ["*"],
        body: [
          [
            {
              svg: signatureData,
              width: 100,
              height: 50,
              alignment: "center",
            },
          ],
          [
            {
              text: displayName,
              alignment: "center",
              margin: [0, 2, 0, 0],
              fontSize: 11,
              color: "#545454",
            },
          ],
          // If attendeeType is enabled and there's a non-null value, show it
          [
            isAttendeeTypeEnabled && attendeeTypeValue
              ? {
                  text: attendeeTypeValue,
                  alignment: "center",
                  margin: [0, 2, 0, 0],
                  fontSize: 10,
                  color: "grey",
                }
              : null,
          ],
        ],
      },
      margin: [0, 0, 0, 0],
    };

    // Add cell to current row
    currentRow.push(signatureCell);

    // If the row reaches itemsPerRow, push it to the tableBody
    if (currentRow.length === itemsPerRow) {
      tableBody.push(currentRow);
      currentRow = []; // Reset row
    }
  });


  // Handle the case for the first and only row (single row case)
  if (currentRow.length < itemsPerRow && tableBody.length === 0) {
    const _body = [];
    _body.unshift([
      {
        ...titleTextObj,
        colSpan: currentRow.length,
      },
      ...Array(currentRow.length - 1).fill({}),
    ]);
    _body.push(currentRow);

    return {
      table: {
        widths: Array(currentRow.length).fill("*"),
        body: _body,
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
      },
    };
  } else if (currentRow.length > 0) {
    // Fill remaining cells for incomplete rows
    // Fill the last cell with appropriate colSpan, add placeholders for the rest
    if (currentRow.length < itemsPerRow) {
      // Set colSpan on the last real cell to fill the row
      currentRow[currentRow.length - 1] = {
        ...currentRow[currentRow.length - 1],
        colSpan: itemsPerRow - currentRow.length + 1
      };
      // Add empty placeholder cells as needed (for pdfmake table structure)
      for (let i = currentRow.length; i < itemsPerRow; i++) {
        currentRow.push({});
      }
    }
    tableBody.push(currentRow);
  }

  if (rowData.length > 1) {
    // Insert the header row at the start of tableBody, with colSpan and dynamic placeholders
    tableBody.unshift([
      {
        ...titleTextObj,
        colSpan: itemsPerRow,
      },
      ...Array(itemsPerRow - 1).fill({}),
    ]);
  }

  // return the table
  return {
    table: {
      widths: Array(itemsPerRow).fill("*"), // Ensure widths match columns
      body: tableBody,
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
    },
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
              if (
                cell.visible &&
                evaluateCondition(cell.visible, data) === false
              ) {
                return null;
              }
              return tableObject(cell, row, staticData);
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
    if (layout.layout === "outside") {
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
          return 4;
        },
        paddingRight: function (i, node) {
          return 4;
        },
        paddingTop: function (i, node) {
          return 2;
        },
        paddingBottom: function (i, node) {
          return 2;
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
          return 4;
        },
        paddingTop: function (i, node) {
          return 2;
        },
        paddingBottom: (i, node) => {
          // This function determines the bottom padding for each row in the table
          const DEFAULT_PADDING = 2;

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
  if (layout.margin) tempTable.margin = layout.margin;
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

const pdfDefinition = (layout, data) => {
  try {
    //temp remove fonts

    // Initialize document definition with styles
    let docDefinition = {
      styles: {
        normalText: {
          fontSize: 12, // Set default font size
          margin: [0, 5, 0, 5], // Set default margin for text
        },
      },
      pageOrientation: layout.setting.orientation ?? "portrait", // Set page orientation, default to portrait
      pageSize: layout.setting.size ?? "LETTER", // Set page size, default to LETTER
      pageMargins: layout.setting.margin ?? [20, 60, 40, 60], // Set page margins, default values
    };

    // Merge additional styles from layout
    const updatedStyles = {
      ...layout.styles,
      normalText: {
        fontSize: 12,
        margin: [0, 5, 0, 5],
      },
    };
    docDefinition.styles = updatedStyles; // Apply updated styles

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

          //docDefinition.content.push(tableObject(content, data, layout.static)); // Add table content
          if (table) {
            // Only add non-null tables
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
