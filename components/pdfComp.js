import dayjs from "dayjs";
import { Buffer } from "buffer";
import pixelWidth from "string-pixel-width";

const evaluateCondition = (conditionString, data) => {
  if (typeof conditionString !== "string" || conditionString.trim() === "") {
    return true; // Default to true if no valid condition is provided
  }
  try {
    return new Function(...Object.keys(data), `return ${conditionString};`)(
      ...Object.values(data)
    );
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

  // Title with a border (no bottom border)
  const titleWithBorder = {
    table: {
      dontBreakRows: true, // Keep title & table content from splitting row by row
      headerRows: 0,
      widths: ["*"], // Full width
      body: [
        [
          {
            text: content.title ?? "Signatures", // Default title if not provided
            alignment: "center",
            margin: [10, 5, 10, 5], // Add margin inside the border
            fontSize: 14,
            bold: true,
          },
        ],
      ],
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
      stack: [
        {
          svg: signatureData,
          width: 100,
          height: 30,
          alignment: "center",
        },
        {
          text: displayName,
          alignment: "center",
          margin: [0, 5, 0, 0],
          fontSize: 11,
          color: "#545454",
        },
        // If attendeeType is enabled and there's a non-null value, show it
        ...(isAttendeeTypeEnabled && attendeeTypeValue
          ? [
              {
                text: attendeeTypeValue,
                alignment: "center",
                margin: [0, 2, 0, 0],
                fontSize: 10,
                color: "grey",
              },
            ]
          : []),
      ],
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

  // Handle cases with one remaining row
  if (currentRow.length === 1 && tableBody.length === 0) {
    // Only one signature, center it on the page
    return {
      unbreakable: true, // Keep entire block together
      stack: [
        titleWithBorder,
        {
          table: {
            widths: ["*"], // Single column width
            body: [currentRow],
            headerRows: 0,
            keepWithHeaderRows: 1,
            dontBreakRows: true,
          },
        },
      ],
    };
  } else if (currentRow.length > 0) {
    // Fill remaining cells for incomplete rows
    while (currentRow.length < itemsPerRow) {
      currentRow.push({ text: "" }); // Add placeholders
    }
    tableBody.push(currentRow);
  }

  // Build and return the full table
  return {
    // unbreakable attempts to keep the entire stack on one page
    unbreakable: true,
    stack: [
      titleWithBorder,
      {
        table: {
          widths: Array(itemsPerRow).fill("*"), // Ensure widths match columns
          body: tableBody,
          headerRows: 0,
          keepWithHeaderRows: 1,
          dontBreakRows: true,
        },
      },
    ],
  };
};

// Main function to generate content based on layout
const object = (
  layout,
  data = null,
  staticData = null,
  isSolo = false,
  jsonData
) => {
  if (layout.visible && evaluateCondition(layout.visible, data) === false) {
    return {
      text: "",
    };
  }

  let valueData = layout.value ?? "";
  let valueDataPrefix = layout.prefix ?? null;
  let valueDataSuffix = layout.suffix ?? null;
  let valueDataToFixed = layout.toFixed || 0 ;

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
    valueData = valueData.toFixed(valueDataToFixed);
  }
  // if there is a prefix, add it to the value
  if (valueDataPrefix) {
    valueData = valueDataPrefix + valueData;
  }
  // if there is a suffix, add it to the value
  if (valueDataSuffix) {
    valueData = valueData + valueDataSuffix;
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
        const table = tableObject(obj, data, staticData);
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

  if (layout.type === "qr") {
    const qrContent = {
      qr: valueData,
    };
    if (layout.foreground) qrContent.foreground = layout.foreground;
    if (layout.background) qrContent.background = layout.background;
    if (layout.fit) qrContent.fit = layout.fit;
    return qrContent;
  }

  if (layout.type === "image") {
    let imageContent = {
      image: valueData,
    };
    if (layout.width) imageContent.width = layout.width || 200;
    if (layout.height) imageContent.height = layout.height || 200;
    if (layout.maxWidth) imageContent.maxWidth = layout.maxWidth;
    if (layout.maxHeight) imageContent.maxHeight = layout.maxHeight;
    if (layout.alignment) imageContent.alignment = layout.alignment;
    if (layout.fit) imageContent.fit = layout.fit;
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
    if (layout.width) svgContent.width = layout.width;
    if (layout.height) svgContent.height = layout.height;
    return svgContent;
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
      style: itemStyle !== null ? itemStyle : layout.style ?? "normalText",
      ...additionalProps
    };
  }
};

// Function to get a nested value from an object based on a path
function getValueFromPath(obj, path) {
  // Use reduce to traverse the object and get the value at the specified path
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
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

    const maxColumns = Math.max(
      layout.body.header ? layout.body.header.length : 0,
      ...layout.body.rows.map((row) => row.length)
    );

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
        return object(cell, cellData, staticData, false, data);
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

      for (const row of rowData) {
        const tableRow = layout.body.rows.map((cell, index) => {
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
              if (cell.value === "table") {
                if (
                  cell.visible &&
                  evaluateCondition(cell.visible, data) === false
                ) {
                  return null;
                }
                return tableObject(cell, data, staticData);
              } else {
                return object(cell, cellData, staticData, false, data);
              }
            } else {
              cellData = cell.value;
              return object(cell, cellData, staticData, false, data);
            }
          }
        });

        while (tableRow.length < maxColumns) {
          tableRow.push({ text: "", style: "normalText" });
        }
        table.body.push(tableRow);
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
          return i === 0 || i === 1 || i === node.table.body.length ? 1 : 0; // Horizontal lines for header and bottom
        },
        vLineWidth: function (i, node) {
          return 1; // All vertical lines
        },
        vLineColor: function (i, node) {
          return "black";
        },
        hLineColor: function (i, node) {
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
        paddingBottom: (rowIndex, node) => {
          // This function determines the bottom padding for each row in the table
          const DEFAULT_PADDING = 2;

          // For the last row in the table
          if (rowIndex === node.table.body.length - 1) {
            // console.log(
            //   "---------------------------------------------------- INDEX ---------------------------------------------------- :",
            //   rowIndex
            // );
            // Get the current position information for the last element
            const currentPosition = node.positions[node.positions.length - 1];
            // Get text content and font size
            const text = node.table.body[node.table.body.length - 1][0].text;
            var width = pixelWidth(text, { size: 10 });
            var lines = width / 250;
            // adding extra bufferr lines based on the lines, as we need to take of the line break if word can't fit in at the end of the line
            if (lines > 5 && lines < 10) {
              lines++;
            } else if (lines > 10) {
              lines += 2;
            }
            // console.log("This text has number of Lines : " + lines);

            // console.log("currentPosition :", currentPosition);
            // Get how far down the page the current element is
            const currentHeight = currentPosition.top;

            // Calculate remaining space between the bottom of the table and end of page
            // 600 because we want the table to be appeared till certain height
            // lines * 10 = as we've assumes 1 line is about 10px height
            const paddingBottom = 600 - currentHeight - lines * 10;
            // console.log(`PADDING BTM : ${paddingBottom}`);

            // Return this space as padding to fill gap to bottom of page
            return paddingBottom;
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
      let footerContent = [];

      // Generate footer content first
      for (const footer of layout.footer.contents) {
        footerContent.push(object(footer, data, layout.static, true, data)); // Generate footer content
      }

      let footerObj = [];

      // Add divider above footer by default unless explicitly set to false
      const showDivider = layout.footer.showDivider !== false;
      if (showDivider) {
        footerObj.push({
          stack: [
            {
              canvas: [
                {
                  type: "line",
                  x1: 0,
                  y1: 0,
                  x2: 570,
                  y2: 0,
                  lineWidth: 1,
                },
              ],
            },
            {
              columns: footerContent,
            },
          ],
        });
      } else {
        footerObj.push({
          columns: footerContent,
        });
      }

      const col = {
        stack: footerObj, // Stack divider and content vertically
      };
      if (layout.footer.margin) col.margin = layout.footer.margin; // Apply footer margin if specified

      // Check if footer should only appear on last page
      if (layout.footer.lastPageOnly) {
        docDefinition.footer = function (currentPage, pageCount) {
          return currentPage === pageCount ? col : null;
        };
      } else {
        docDefinition.footer = col; // Show footer on all pages
      }
    }
    return docDefinition;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
    //return error; // Return error for handling
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
