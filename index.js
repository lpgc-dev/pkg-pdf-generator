import genFrontPdf from "./components/frontEnd.js";
import genBackPdf from "./components/backEnd.js";
import PDFMerger from "pdf-merger-js";
import { PDFDocument } from "pdf-lib";
const pdfFrontBase64 = async (layout, data) => {
  return await genFrontPdf(layout, data);
};

const pdfBackBase64 = async (layout, data) => {
  return await genBackPdf(layout, data);
};

// utility func to get value from the obj based on path
const getValueFromPath = (obj, path) => {
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
};
// Export Functions
const isBrowser = () => typeof window !== "undefined";

const pdfBase64 = async (layout, data) => {
  let pdfBase64Data = null;

  // Generate initial PDF
  if (isBrowser() && genFrontPdf) {
    pdfBase64Data = await genFrontPdf(layout, data);
  } else if (genBackPdf) {
    pdfBase64Data = await genBackPdf(layout, data);
  } else {
    throw new Error("No valid PDF generation module available");
  }

  // check if additionalContent is present and type is mergePdf then append the additional PDF
  if (layout.additionalContent && layout.additionalContent.type == "mergePdf") {
    let pdfAttachments = getValueFromPath(data, layout.additionalContent.value);
    // If there are attachments, merge them
    if (pdfAttachments && pdfAttachments.length > 0) {
      const merger = new PDFMerger();

      // Add main PDF
      const mainPdfBuffer =
        typeof Buffer !== "undefined"
          ? Buffer.from(pdfBase64Data.split(",")[1], "base64")
          : Uint8Array.from(atob(pdfBase64Data.split(",")[1]), (c) =>
              c.charCodeAt(0)
            );
      await merger.add(mainPdfBuffer);

      // Add all attachments
      for (const attachment of pdfAttachments) {
        let attachmentBuffer = null;
        // check if content is base64 encoded
        if (attachment.content) {
          // Only process if content is PDF
          if (attachment.content.includes("application/pdf")) {
            attachmentBuffer =
              typeof Buffer !== "undefined"
                ? Buffer.from(attachment.content.split(",")[1], "base64")
                : Uint8Array.from(atob(attachment.content.split(",")[1]), (c) =>
                    c.charCodeAt(0)
                  );
          }
          // if url exists then download the url and convert to buffer
        } else if (attachment.url) {
          // download the url and convert to buffer
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          
          // For PDFs, use directly
          if (blob.type === "application/pdf") {
            attachmentBuffer =
              typeof Buffer !== "undefined"
                ? Buffer.from(await blob.arrayBuffer())
                : Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
          }
          // For images, convert to PDF
          else if (blob.type.startsWith("image/")) {
            // Create a new PDF document with LETTER size
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([612, 792]); // LETTER size in points (8.5" x 11")
            
            // Convert blob to array buffer and embed image
            const imgBuffer = await blob.arrayBuffer();
            let image;
            if (blob.type === "image/png") {
              image = await pdfDoc.embedPng(imgBuffer);
            } else if (blob.type === "image/jpeg") {
              image = await pdfDoc.embedJpg(imgBuffer);
            }

            // Calculate dimensions to fit image on LETTER page
            const { width, height } = page.getSize(); // Will be 612x792 points
            const imgDims = image.scale(1);
            const scale = Math.min(
              (width - 40) / imgDims.width, // Subtract 40 (20 on each side) from width
              height / imgDims.height
            );

            // Draw image centered on page with 20 margin on each side
            page.drawImage(image, {
              x: 20 + (width - 40 - imgDims.width * scale) / 2, // Add 20 margin and center in remaining width
              y: (height - imgDims.height * scale) / 2,
              width: imgDims.width * scale,
              height: imgDims.height * scale,
            });

            // Convert to buffer
            attachmentBuffer = await pdfDoc.save();
          }
        }
        // if attachmentBuffer is not null then add to merger
        if (attachmentBuffer) await merger.add(attachmentBuffer);
      }

      // Get merged PDF as base64
      const mergedPdf = await merger.saveAsBuffer();
      pdfBase64Data = `data:application/pdf;base64,${mergedPdf.toString(
        "base64"
      )}`;
    }
  }

  return pdfBase64Data;
};

export { pdfFrontBase64, pdfBackBase64, pdfBase64 };
