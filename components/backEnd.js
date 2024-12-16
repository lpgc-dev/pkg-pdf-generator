const pdfDefinition = require("./pdfComp"); // PDF layout definition
const pdfMakePrinter = require("pdfmake");
// Font configuration for PDFMake
const fonts = {
  Roboto: {
    normal: "assets/roboto/Roboto-Black.ttf",
    bold: "assets/roboto/Roboto-Bold.ttf",
    italics: "assets/roboto/Roboto-Italic.ttf",
    bolditalics: "assets/roboto/Roboto-BoldItalic.ttf"
  }
};
// PDF generation library
// import roboto from '../assets/roboto/roboto';
// pdfMakePrinter.v

const genBackPdf = async (layout, data) => {
  const pdfDef = pdfDefinition(layout, data);
  const pdf = new pdfMakePrinter(fonts);
  // Create the PDF document and save it to a file
  const pdfDoc = pdf.createPdfKitDocument(pdfDef);
  let chunks = [];
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk);
  });
  return new Promise((resolve, reject) => {
    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64Pdf = pdfBuffer.toString("base64");
      // Prefix the Base64 string with application/pdf
      const base64WithMimeType = `data:application/pdf;base64,${base64Pdf}`;
      resolve(base64WithMimeType); // Resolve with Base64 string
    });

    pdfDoc.on("error", (err) => {
      reject(err);
    });

    pdfDoc.end();
  });
};

module.exports = genBackPdf;
