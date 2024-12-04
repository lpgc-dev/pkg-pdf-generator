//genPDF.js
//TODO  to support front end removed a few things.. goal will be to make it work with front end and backend
const pdfDefinition = require('./components/pdfComp'); // PDF layout definition




// Import necessary libraries

//const pdfMakePrinter = require('pdfmake'); // PDF generation library
import pdfMake from 'pdfmake/build/pdfmake';
import roboto from './assets/roboto/roboto'
pdfMake.vfs = roboto;
//import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register the fonts with pdfMake
//pdfMake.vfs = pdfFonts.pdfMake.vfs;
/*
let fs;
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    fs = require('fs'); // Node.js module for file system operations
}
*/

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




// Function to generate the PDF and save it to a file
const runPdfGenerator = async (layout, data,  type = 'buffer',  res = null) => {


		// Create the PDF document and save it to a file
		//const pdfDoc = pdf.createPdfKitDocument(docDefinition);

		const pdfDef= pdfDefinition(layout, data);
		//const pdfDoc = pdfMake.createPdf(pdfDef)
		if (type === 'buffer') {
			return new Promise((resolve, reject) => {
                pdfMake.createPdf(pdfDef).getBase64(base64 => {
                    const base64WithMimeType = `data:application/pdf;base64,${base64}`;
                    resolve(base64WithMimeType);
                });
            });
			/*
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
			*/
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
	
};

// Export the PDF generator function for use in other modules
module.exports = runPdfGenerator;