//genPDF.js
//TODO  to support front end removed a few things.. goal will be to make it work with front end and backend
const pdfDefinition = require("./components/pdfComp"); // PDF layout definition

// Import necessary libraries

//const pdfMakePrinter = require('pdfmake'); // PDF generation library
import pdfMake from "pdfmake/build/pdfmake";
import roboto from "./assets/roboto/roboto";
pdfMake.vfs = roboto;

// Function to generate the PDF and save it to a file
const runPdfGenerator = async (layout, data, type = "buffer", res = null) => {
  try {
    const pdfDef = pdfDefinition(layout, data);
    return new Promise((resolve, reject) => {
      pdfMake.createPdf(pdfDef).getBase64((base64) => {
        const base64WithMimeType = `data:application/pdf;base64,${base64}`;
        resolve(base64WithMimeType);
      });
    });
  } catch (error) {
    throw new Error("Error generating PDF:", error);
  }
};

// Export the PDF generator function for use in other modules
module.exports = runPdfGenerator;
