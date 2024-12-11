// index.js
/*const runPdfGenerator = require('./genPDF.js'); */
let genFrontPdf, genBackPdf;
try {
  if (typeof window === "undefined") {
    // Backend environment
    genBackPdf = require("./components/backEnd");
  } else {
    // Frontend environment
    genFrontPdf = require("./components/frontEnd");
  }
} catch (error) {
  console.warn("Unable to load one of the modules:", error.message);
}

const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", async (req, res) => {
  try {
    const readJson = require("./readJson.js");
    const jsonLayout = await readJson("condition.json");
    const jsonData = await readJson("data/condition.json");

    // Generate the Base64 PDF string with prefix
    const base64Pdf = await genBackPdf(jsonLayout, jsonData);

    // Remove the prefix if it exists
    const base64Content = base64Pdf.replace("data:application/pdf;base64,", "");

    // Decode the Base64 string to binary
    const pdfBuffer = Buffer.from(base64Content, "base64");

    // Send the PDF directly
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=output.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error processing request");
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const pdfFrontBase64 = async (layout, data) => {
  return await genFrontPdf(layout, data);
};

const pdfBackBase64 = async (layout, data) => {
  return await genBackPdf(layout, data);
};
// Export Functions
const isBrowser = () => typeof window !== "undefined";
const pdfBase64 = async (layout, data) => {
  if (isBrowser() && genFrontPdf) {
    return await genFrontPdf(layout, data);
  } else if (genBackPdf) {
    return await genBackPdf(layout, data);
  } else {
    throw new Error("No valid PDF generation module available");
  }
};
module.exports = {
  pdfFrontBase64,
  pdfBackBase64,
  pdfBase64
};
