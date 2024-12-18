import dayjs from "dayjs";
import { Buffer } from "buffer";

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
      widths: ["*"], // Full width
      body: [
        [
          {
            text: content.title ?? "Signatures", // Default title if not provided
            alignment: "center",
            margin: [10, 5, 10, 5], // Add margin inside the border
            fontSize: 14,
            bold: true
          }
        ]
      ]
    },
    layout: {
      hLineWidth: (i) => (i === 0 ? 1 : 0), // Top horizontal line only
      vLineWidth: () => 1, // Vertical lines
      hLineColor: () => "#000000", // Horizontal line color
      vLineColor: () => "#000000" // Vertical line color
    }
  };

  // If no attendees exist, return only the title with an empty table
  if (!Array.isArray(rowData) || rowData.length === 0) {
    return {
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
                  alignment: "center"
                }
              ]
            ],
            layout: "noBorders" // Optional: remove borders for the empty state
          }
        }
      ]
    };
  }

  // Iterate over attendees and create signature cells
  rowData.forEach((attendee) => {
    let signatureData = getValueFromPath(attendee, content.signature) || ""; // Get SVG data

    // Decode base64 if applicable
    signatureData = decodeBase64Svg(signatureData);

    // Validate and provide fallback for SVG
    if (!signatureData.startsWith("<svg")) {
      console.warn("Invalid SVG data:", signatureData);
      signatureData = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">
        <rect width="100" height="50" fill="#ccc"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-size="10">
          Invalid SVG
        </text>
      </svg>`;
    }

    const displayName =
      getValueFromPath(attendee, content.displayNames) || "Unknown"; // Get attendee name

    // Create the signature cell
    const signatureCell = {
      stack: [
        {
          svg: signatureData,
          width: 100,
          height: 30,
          alignment: "center"
        },
        {
          text: displayName,
          alignment: "center",
          margin: [0, 5, 0, 0],
          fontSize: 10, // Make the font size smaller
          color: "grey" // Set the color to grey
        }
      ],
      margin: [0, 0, 0, 0]
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
      stack: [
        titleWithBorder,
        {
          table: {
            widths: ["*"], // Single column width
            body: [currentRow]
          }
        }
      ]
    };
  } else if (currentRow.length > 0) {
    // Fill remaining cells for incomplete rows
    while (currentRow.length < itemsPerRow) {
      currentRow.push({ text: "" }); // Add placeholders
    }
    tableBody.push(currentRow);
  }

  // Construct the table
  return {
    stack: [
      titleWithBorder,
      {
        table: {
          widths: Array(itemsPerRow).fill("*"), // Ensure widths match columns
          body: tableBody
        }
      }
    ]
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
  if (layout.visible)
    if (evaluateCondition(layout.visible, data) === false) {
      // Check if the object should be visible based on a condition
      return {
        text: ""
      };
    }

  let valueData = layout.value ?? ""; // Default value from layout
  let itemStyle = null; // Variable for item style

  // Set valueData based on data provided if isSolo is false
  if (isSolo === false) {
    if (data !== null) {
      valueData = data;
    } else {
      valueData = layout.value;
    }
  }

  // Check if valueData is an array and process accordingly
  const checkHeaderArray = Array.isArray(valueData);
  if (checkHeaderArray) {
    if (valueData[0] === "$") {
      // Remove the '$' and get the value from the static object
      const removeFirst = valueData.slice(1);
      valueData = getValueFromPath(staticData, removeFirst);
    } else {
      // Get value from the jsonData object
      valueData = getValueFromPath(jsonData, valueData);
    }
  }

  // Handle condition in the layout
  if (layout.condition) {
    let obj = getValueBasedOnType(valueData, layout.condition);
    if (obj === null || obj === undefined || obj === "") {
      if (layout.condition.isNUll) {
        if (layout.condition.isNUll.type) {
          if (layout.condition.isNUll.type === "table") {
            // Handle table content
            const table = tableObject(
              layout.condition.isNUll,
              data,
              staticData
            );
            return table;
          }
        }
        valueData = layout.condition.isNUll.value;
      }
    } else if (obj !== undefined && obj !== null) {
      // Update valueData if the condition has a string value
      if (isString(obj.value)) {
        valueData = obj.value;
      }

      if (obj.type) {
        if (obj.type === "table") {
          if (obj.visible)
            if (evaluateCondition(obj.visible, data) === false) {
              return null;
            }
          // Handle table content
          const table = tableObject(obj, data, staticData);
          return table;
        }
      } else {
        // Check if obj.value is an object and handle recursively
        const checkObject2 = checkObject(obj.value);
        if (checkObject2) {
          const tempObj = object(obj.value, null, staticData, true, jsonData);
          return tempObj;
        }

        // Set itemStyle if specified in the condition
        if (obj.style) {
          itemStyle = obj.style;
        }
      }
    }
  }

  // Handle different layout types (e.g., QR, image, SVG)
  if (layout.type === "qr") {
    const qrContent = {
      qr: valueData // Set the QR content
    };
    if (layout.foreground) qrContent.foreground = layout.foreground; // Set QR foreground color if specified
    if (layout.background) qrContent.background = layout.background; // Set QR background color if specified
    if (layout.fit) qrContent.fit = layout.fit; // Set QR size if specified
    return qrContent; // Return QR content
  }

  if (layout.type === "image") {
    let imageContent = {
      image: valueData // Set the image content
    };
    if (layout.width) imageContent.width = layout.width || 200; // Set image width if specified
    if (layout.height) imageContent.height = layout.height || 200; // Set image height if specified
    if (layout.maxWidth) imageContent.maxWidth = layout.maxWidth; // Set image maxWidth if specified
    if (layout.maxHeight) imageContent.maxHeight = layout.maxHeight; // Set image maxHeight if specified
    if (layout.alignment) imageContent.alignment = layout.alignment; // Set image alignment if specified
    return imageContent; // Return image content
  } else if (layout.type === "svg") {
    // Check if valueData is a base64-encoded SVG
    const hasSignature =
      valueData && valueData.startsWith("data:image/svg+xml;base64,");
    const decodedSvg = hasSignature
      ? BufferObj.from(
          valueData.replace("data:image/svg+xml;base64,", ""),
          "base64"
        ).toString("utf-8")
      : null;
    let svgContent = {
      svg: decodedSvg // Set the SVG content
    };
    if (layout.width) svgContent.width = layout.width; // Set SVG width if specified
    if (layout.height) svgContent.height = layout.height; // Set SVG height if specified
    return svgContent; // Return SVG content
  } else {
    // Handle date formatting if specified in the layout
    if (layout.format) {
      if (layout.format.type === "date") {
        if (valueData === null || valueData === undefined) {
          valueData = ""; // Set empty string if value is null or undefined
        } else {
          valueData = dayjs(valueData).format(layout.format.value); // Format date using dayjs
        }
      }
    }
    // Return text content with optional alignment and style
    return {
      text: valueData,
      alignment: layout.alignment ?? "left", // Default alignment is left
      style: itemStyle !== null ? itemStyle : layout.style ?? "normalText" // Apply style if available
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
  const table = {}; // Initialize table object
  if (layout.widths) table.widths = layout.widths; // Set column widths if defined
  if (layout.width) table.width = layout.width; // Set table width if defined

  if (layout.body) {
    table.body = []; // Initialize table body

    // Calculate the maximum number of columns in the table
    const maxColumns = Math.max(
      layout.body.header ? layout.body.header.length : 0,
      ...layout.body.rows.map((row) => row.length)
    );

    // Add the header row if it exists
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
      // Check if header data is an object
      const checkObject2 = checkObject(layout.headerData);
      if (checkObject2) {
        headerData = getValueFromPath(data, layout.headerData);
      }

      // Create header row by mapping over each cell
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
        return object(cell, cellData, staticData, false, data); // Return formatted cell content
      });

      // Add padding to header row if needed to match `maxColumns`
      while (headerRow.length < maxColumns) {
        headerRow.push({ text: "", style: "normalText" }); // Add empty cells
      }
      table.body.push(headerRow); // Add header row to table body
    }

    // Add table rows with optional padding for uneven cells
    let rowData = null;
    if (layout.rowData !== undefined && layout.rowData !== null) {
      if (layout.rowData === "$") {
        rowData = getValueFromPath(staticData, layout.rowData);
      } else {
        rowData = getValueFromPath(data, layout.rowData);
      }
    }
    if (rowData !== null) {
      // Apply ignoreEmpty logic if specified
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

      // Iterate over each row of data and create table rows
      for (const row of rowData) {
        const tableRow = layout.body.rows.map((cell, index) => {
          let cellData = null;
          if (
            cell.type === "table" &&
            rowData !== null &&
            cell.rowData !== undefined &&
            cell.rowData !== null
          ) {
            if (cell.visible)
              if (evaluateCondition(cell.visible, data) === false) {
                return null;
              }
            return tableObject(cell, row, staticData); // Handle nested tables recursively
          } else {
            const isArray = Array.isArray(cell.value);
            if (isArray) {
              cellData = getValueFromPath(row, cell.value); // Get cell data from row
              if (cell.value === "table") {
                if (cell.visible)
                  if (evaluateCondition(cell.visible, data) === false) {
                    return null;
                  }
                return tableObject(cell, data, staticData); // Handle table cell content
              } else {
                return object(cell, cellData, staticData, false, data); // Create cell content
              }
            } else {
              cellData = cell.value; // Direct value for the cell

              return object(cell, cellData, staticData, false, data); // Return formatted cell content
            }
          }
        });

        // Add padding to row if needed to match `maxColumns`
        while (tableRow.length < maxColumns) {
          tableRow.push({ text: "" }); // Add empty cells
        }
        //console.log(tableRow);
        table.body.push(tableRow); // Add row to table body
      }
    } else {
      // Handle cases where no row data is specified
      for (const row of layout.body.rows) {
        const tableRow = row.map((cell, index) => {
          if (cell.type === "table") {
            if (cell.visible)
              if (evaluateCondition(cell.visible, data) === false) {
                return null;
              }
            return tableObject(cell, data, staticData); // Handle nested table cell content
          } else {
            return object(cell, null, staticData, false, data); // Create standard cell content
          }
        });

        // Add padding to row if needed to match `maxColumns`
        while (tableRow.length < maxColumns) {
          tableRow.push({ text: "" }); // Add empty cells
        }
        table.body.push(tableRow); // Add row to table body
      }
    }
  }

  // If the table has no rows (header only), return null
  if (table.body.length <= (layout.body.header ? 1 : 0)) {
    return null;
  }

  table.headerRows = 1; // Set the number of header rows

  if (layout.dontBreakRows) {
    table.dontBreakRows = true; // Prevent row breaks
  }
  if (layout.keepWithHeaderRows) {
    table.keepWithHeaderRows = layout.keepWithHeaderRows; // Keep header rows with content
  }

  let tempTable = { table: table }; // Create table structure
  if (layout.layout) {
    // Apply custom layout if specified
    if (layout.layout === "outside") {
      tempTable.layout = {
        hLineWidth: function (i, node) {
          return i === 0 || i === node.table.body.length ? 1 : 0; // Draw lines only on the outer border
        },
        vLineWidth: function (i, node) {
          return i === 0 || i === node.table.widths.length ? 1 : 0; // Draw lines only on the outer border
        },
        hLineColor: function (i, node) {
          return "black"; // Set color for horizontal lines
        },
        vLineColor: function (i, node) {
          return "black"; // Set color for vertical lines
        },
        paddingLeft: function (i, node) {
          return 4; // Left padding for cells
        },
        paddingRight: function (i, node) {
          return 4; // Right padding for cells
        },
        paddingTop: function (i, node) {
          return 2; // Top padding for cells
        },
        paddingBottom: function (i, node) {
          return 2; // Bottom padding for cells
        }
      };
    } else {
      tempTable.layout = layout.layout; // Apply provided layout
    }
  }
  if (layout.margin) tempTable.margin = layout.margin; // Apply margin if defined

  return tempTable; // Return the complete table object
};

const pdfDefinition = (layout, data) => {
  console.log("layout", data);
  try {
    //temp remove fonts

    // Initialize document definition with styles
    let docDefinition = {
      styles: {
        normalText: {
          fontSize: 12, // Set default font size
          margin: [0, 5, 0, 5] // Set default margin for text
        }
      },
      pageOrientation: layout.setting.orientation ?? "portrait", // Set page orientation, default to portrait
      pageSize: layout.setting.size ?? "LETTER", // Set page size, default to LETTER
      pageMargins: layout.setting.margin ?? [20, 60, 40, 60] // Set page margins, default values
    };

    // Merge additional styles from layout
    const updatedStyles = {
      ...layout.styles,
      normalText: {
        fontSize: 12,
        margin: [0, 5, 0, 5]
      }
    };
    docDefinition.styles = updatedStyles; // Apply updated styles

    // Handle document header if specified in layout
    if (layout.header) {
      let headerObj = [];
      for (const header of layout.header.contents) {
        headerObj.push(object(header, data, layout.static, true, data)); // Generate header content
      }
      const col = {
        columns: headerObj // Create columns for header content
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
            columns: columns // Create columns for body content
          };
          if (content.columnGap) columnData.columnGap = content.columnGap; // Apply column gap if defined
          if (content.width) columnData.width = content.width; // Set column width if specified

          docDefinition.content.push(columnData); // Add columns to document content
        } else if (content.type === "signature") {
          const signatureTable = generateSignatureTable(content, data); // Generate signature table
          docDefinition.content.push(signatureTable); // Add signature table to document content
        }
      }
    }

    // Handle document footer if specified in layout
    if (layout.footer) {
      let footerObj = [];
      for (const footer of layout.footer.contents) {
        footerObj.push(object(footer, data, layout.static, true, data)); // Generate footer content
      }
      const col = {
        columns: footerObj // Create columns for footer content
      };
      if (layout.footer.margin) col.margin = layout.footer.margin; // Apply footer margin if specified

      docDefinition.footer = col; // Set document footer
    }
    return docDefinition;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
    //console.log(error); // Log any errors that occur
    //return error; // Return error for handling
  }
};
export default pdfDefinition;
