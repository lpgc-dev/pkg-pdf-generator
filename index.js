import genFrontPdf from "./components/frontEnd.js";
import genBackPdf from "./components/backEnd.js";
import PDFMerger from "pdf-merger-js";

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
      const mainPdfBuffer = Buffer.from(pdfBase64Data.split(",")[1], "base64");
      await merger.add(mainPdfBuffer);

      // Add all attachments
      for (const attachment of pdfAttachments) {
        let attachmentBuffer = null;
        // check if content is base64 encoded
        if (attachment.content) {
          attachmentBuffer = Buffer.from(
            attachment.content.split(",")[1],
            "base64"
          );
          // if url exist then download the url and convert to buffer
        } else if (attachment.url) {
          // download the url and convert to buffer
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          attachmentBuffer = Buffer.from(await blob.arrayBuffer());
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
