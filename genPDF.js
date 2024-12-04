//genPDF.js

// Import necessary libraries
const dayjs = require('dayjs'); // Library for handling date formatting
//const pdfMakePrinter = require('pdfmake'); // PDF generation library
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register the fonts with pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;
/*
let fs;
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    fs = require('fs'); // Node.js module for file system operations
}
*/

// Utility function to check if a variable is a string
function isString(variable) {
	return typeof variable === 'string';
}

// Font configuration for PDFMake
/*
const fonts = {
	Roboto: {
		normal: 'assets/font/roboto/Roboto-Regular.ttf',
		bold: 'assets/font/roboto/Roboto-Bold.ttf',
		italics: 'assets/font/roboto/Roboto-Italic.ttf',
		bolditalics: 'assets/font/roboto/Roboto-BoldItalic.ttf'
	}
};
*/

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

// Main function to generate content based on layout
const object = (layout, data = null, staticData = null, isSolo = false, jsonData) => {
	let valueData = layout.value ?? ''; // Default value from layout
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
		if (valueData[0] === '$') {
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
		if (obj !== undefined && obj !== null) {
			// Update valueData if the condition has a string value
			if (isString(obj.value)) {
				valueData = obj.value;
			}

			// Check if obj.value is an object and handle recursively
			const checkObject2 = checkObject(obj.value);
			if (checkObject2) {
				return object(obj.value, null, staticData, true, jsonData);
			}

			// Set itemStyle if specified in the condition
			if (obj.style) {
				itemStyle = obj.style;
			}
		}
	}

	// Handle different layout types (e.g., QR, image, SVG)
	if (layout.type === 'qr') {
		const qrContent = {
			qr: valueData // Set the QR content
		};
		if (layout.foreground) qrContent.foreground = layout.foreground; // Set QR foreground color if specified
		if (layout.background) qrContent.background = layout.background; // Set QR background color if specified
		if (layout.fit) qrContent.fit = layout.fit; // Set QR size if specified
		return qrContent; // Return QR content
	}

	if (layout.type === 'image') {
		let imageContent = {
			image: valueData // Set the image content
		};
		if (layout.width) imageContent.width = layout.width; // Set image width if specified
		if (layout.height) imageContent.height = layout.height; // Set image height if specified
		if (layout.alignment) imageContent.alignment = layout.alignment; // Set image alignment if specified
		return imageContent; // Return image content
	} else if (layout.type === 'svg') {
		// Check if valueData is a base64-encoded SVG
		const hasSignature = valueData && valueData.startsWith('data:image/svg+xml;base64,');
		const decodedSvg = hasSignature ? Buffer.from(valueData.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8') : null;
		let svgContent = {
			svg: decodedSvg // Set the SVG content
		};
		if (layout.width) svgContent.width = layout.width; // Set SVG width if specified
		if (layout.height) svgContent.height = layout.height; // Set SVG height if specified
		return svgContent; // Return SVG content
	} else {
		// Handle date formatting if specified in the layout
		if (layout.format) {
			if (layout.format.type === 'date') {
				valueData = dayjs(valueData).format(layout.format.value); // Format date using dayjs
			}
		}
		// Return text content with optional alignment and style
		return {
			text: valueData,
			alignment: layout.alignment ?? 'left', // Default alignment is left
			style: itemStyle !== null ? itemStyle : layout.style ?? 'normalText' // Apply style if available
		};
	}
};

// Function to get a nested value from an object based on a path
function getValueFromPath(obj, path) {
	// Use reduce to traverse the object and get the value at the specified path
	return path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

// Utility function to check if a variable is an object (excluding arrays)
function checkObject(input) {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}

// Function to create a table structure for the PDF
const tableObject = (layout, data, staticData) => {
	const table = {}; // Initialize table object
	if (layout.widths) table.widths = layout.widths; // Set column widths if defined
	if (layout.width) table.width = layout.width; // Set table width if defined

	if (layout.body) {
		table.body = []; // Initialize table body

		// Calculate the maximum number of columns in the table
		const maxColumns = Math.max(layout.body.header ? layout.body.header.length : 0, ...layout.body.rows.map(row => row.length));

		// Add the header row if it exists
		if (layout.body.header) {
			let headerData = null;
			const checkHeaderArray = Array.isArray(layout.headerData);
			if (checkHeaderArray) {
				if (layout.headerData[0] === '$') {
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
					const isObject = checkObject(headerData[index]) || checkObject(headerData);
					if (isObject) {
						cellData = getValueFromPath(headerData, cell.value);
					} else {
						cellData = headerData[index];
					}
				} else {
					const isArray = Array.isArray(cell.value);
					if (isArray) {
						if (cell.value[0] === '$') {
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
				headerRow.push({ text: '', style: 'normalText' }); // Add empty cells
			}
			table.body.push(headerRow); // Add header row to table body
		}

		// Add table rows with optional padding for uneven cells
		let rowData = null;
		if (layout.rowData !== undefined && layout.rowData !== null) {
			if (layout.rowData === '$') {
				rowData = getValueFromPath(staticData, layout.rowData);
			} else {
				rowData = getValueFromPath(data, layout.rowData);
			}
		}
		if (rowData !== null) {
			 // Apply ignoreEmpty logic if specified
			 if (layout.ignoreEmpty?.enable && layout.ignoreEmpty?.value) {
                rowData = rowData.filter(row =>
                    !layout.ignoreEmpty.value.every(field => {
                        const fieldValue = getValueFromPath(row, [field]);
                        return fieldValue === undefined || fieldValue === null || fieldValue === '';
                    })
                );
            }



			// Iterate over each row of data and create table rows
			for (const row of rowData) {
				const tableRow = layout.body.rows.map((cell, index) => {
					let cellData = null;
					if (cell.type === 'table' && rowData !== null && cell.rowData !== undefined && cell.rowData !== null) {
						return tableObject(cell, row, staticData); // Handle nested tables recursively
						
					} else {
						const isArray = Array.isArray(cell.value);
						if (isArray) {
							cellData = getValueFromPath(row, cell.value); // Get cell data from row
							if (cell.value === "table") {
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
					tableRow.push({ text: '' }); // Add empty cells
				}
				//console.log(tableRow);
				table.body.push(tableRow); // Add row to table body
			}
		} else {
			// Handle cases where no row data is specified
			for (const row of layout.body.rows) {
				const tableRow = row.map((cell, index) => {
					if (cell.type === "table") {
						return tableObject(cell, data, staticData); // Handle nested table cell content
					} else {
						return object(cell, null, staticData, false, data); // Create standard cell content
					}
				});

				// Add padding to row if needed to match `maxColumns`
				while (tableRow.length < maxColumns) {
					tableRow.push({ text: '' }); // Add empty cells
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
	let tempTable = { table: table }; // Create table structure
	if (layout.layout) {
		// Apply custom layout if specified
		if (layout.layout === 'outside') {
			tempTable.layout = {
				hLineWidth: function (i, node) {
					return (i === 0 || i === node.table.body.length) ? 1 : 0; // Draw lines only on the outer border
				}, vLineWidth: function (i, node) {
					return (i === 0 || i === node.table.widths.length) ? 1 : 0; // Draw lines only on the outer border
				}, hLineColor: function (i, node) {
					return 'black'; // Set color for horizontal lines
				}, vLineColor: function (i, node) {
					return 'black'; // Set color for vertical lines
				}, paddingLeft: function (i, node) {
					return 4; // Left padding for cells
				}, paddingRight: function (i, node) {
					return 4; // Right padding for cells
				}, paddingTop: function (i, node) {
					return 2; // Top padding for cells
				}, paddingBottom: function (i, node) {
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

// Function to generate the PDF and save it to a file
const runPdfGenerator = async (layout, data,  type = 'buffer',  res = null) => {
	try {
		//temp remove fonts
		const pdf = new pdfMake.createPdf();// Create a new PDF printer instance

		// Initialize document definition with styles
		let docDefinition = {
			styles: {
				normalText: {
					fontSize: 12, // Set default font size
					margin: [0, 5, 0, 5] // Set default margin for text
				}
			},
			pageOrientation: layout.setting.orientation ?? 'portrait', // Set page orientation, default to portrait
			pageSize: layout.setting.size ?? 'LETTER', // Set page size, default to LETTER
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
				if (content.type === 'table') {

					const table = tableObject(content, data, layout.static);
					
					//docDefinition.content.push(tableObject(content, data, layout.static)); // Add table content
					if (table) { // Only add non-null tables
						docDefinition.content.push(table);
					}




				} else if (content.type === 'columns') {
					const columns = [];
					for (const column of content.contents) {
						if (column.type === 'table') {

							const table  = tableObject(column, data, layout.static, true, data);
							if(table) {
								columns.push(table);
							}
							//columns.push(tableObject(column, data, layout.static, true, data)); // Add table column
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


		// Create the PDF document and save it to a file
		const pdfDoc = pdf.createPdfKitDocument(docDefinition);

		
		if (type === 'buffer') {
            let chunks = [];
            pdfDoc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            return new Promise((resolve, reject) => {
                pdfDoc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    const base64Pdf = pdfBuffer.toString('base64');
                    // Prefix the Base64 string with application/pdf
                    const base64WithMimeType = `data:application/pdf;base64,${base64Pdf}`;
                    resolve(base64WithMimeType); // Resolve with Base64 string
                });
    
                pdfDoc.on('error', (err) => {
                    reject(err);
                });
    
                pdfDoc.end();
            });
        } else if (type === 'direct' && res !== null) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=output.pdf');
            pdfDoc.pipe(res);
            pdfDoc.end();
        } else {
			
			/*
			if (fs) {
            pdfDoc.pipe(fs.createWriteStream('output.pdf')); // Output file path
            pdfDoc.end(); // Finish writing the PDF
			} else {
				throw new Error('File system not available');
			}
				*/
        }
	} catch (error) {
		throw new Error(`PDF generation failed: ${error.message}`);
		//console.log(error); // Log any errors that occur
		//return error; // Return error for handling
	}
};

// Export the PDF generator function for use in other modules
module.exports = runPdfGenerator;