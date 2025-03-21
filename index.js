import genFrontPdf from "./components/frontEnd.js";
import genBackPdf from "./components/backEnd.js";
import PDFMerger from "pdf-merger-js";
import { PDFDocument } from "pdf-lib";

// Utility functions
const isBrowser = () => typeof window !== "undefined";

const getValueFromPath = (obj, path) => {
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
};

const base64ToFile = (base64, fileName, contentType = "") => {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return new File([blob], fileName, { type: contentType });
};

const createPDFFromImage = async (pdfDoc, blob, arrayBuffer) => {
  const margin = 40;
  const image = blob.type === "image/jpeg" 
    ? await pdfDoc.embedJpg(isBrowser() ? arrayBuffer : Buffer.from(arrayBuffer))
    : await pdfDoc.embedPng(isBrowser() ? arrayBuffer : Buffer.from(arrayBuffer));

  const page = pdfDoc.addPage([612, 792]); // LETTER size
  const { width, height } = page.getSize();

  const imgDims = image.scale(1);
  const scale = Math.min(
    (width - margin) / imgDims.width,
    height / imgDims.height
  );

  page.drawImage(image, {
    x: 20 + (width - 40 - imgDims.width * scale) / 2,
    y: (height - imgDims.height * scale) / 2,
    width: imgDims.width * scale,
    height: imgDims.height * scale,
  });

  return pdfDoc;
};

async function getNetworkAttachment(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  if (blob.type === "application/pdf") {
    return isBrowser() ? new Uint8Array(arrayBuffer) : Buffer.from(arrayBuffer);
  } 
  
  if (blob.type.startsWith("image/")) {
    const pdfDoc = await PDFDocument.create();
    await createPDFFromImage(pdfDoc, blob, arrayBuffer);
    const pdfBytes = await pdfDoc.save();
    return isBrowser() ? new Uint8Array(pdfBytes) : Buffer.from(pdfBytes);
  }

  return null;
}

const mergePDFs = async (pdfBase64Data, pdfAttachments, isBrowserEnv) => {
  const merger = new PDFMerger();

  if (isBrowserEnv) {
    const mainPdfFile = base64ToFile(pdfBase64Data, "main.pdf", "application/pdf");
    await merger.add(mainPdfFile);

    for (const attachment of pdfAttachments) {
      if (attachment.url) {
        const attachmentBuffer = await getNetworkAttachment(attachment.url);
        if (attachmentBuffer) await merger.add(attachmentBuffer);
      }
    }

    const mergedPdfBlob = await merger.saveAsBlob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(mergedPdfBlob);
    });
  } else {
    const mainPdfBuffer = Buffer.from(pdfBase64Data.split(",")[1], "base64");
    await merger.add(mainPdfBuffer);

    for (const attachment of pdfAttachments) {
      if (attachment.url) {
        const attachmentBuffer = await getNetworkAttachment(attachment.url);
        if (attachmentBuffer) await merger.add(attachmentBuffer);
      }
    }

    const mergedPdf = await merger.saveAsBuffer();
    return `data:application/pdf;base64,${mergedPdf.toString("base64")}`;
  }
};

// Main PDF generation functions
const pdfFrontBase64 = async (layout, data) => {
  return await genFrontPdf(layout, data);
};

const pdfBackBase64 = async (layout, data) => {
  return await genBackPdf(layout, data);
};

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

  // Handle additional PDF content
  if (layout.additionalContent?.type === "mergePdf") {
    const pdfAttachments = getValueFromPath(data, layout.additionalContent.value);
    if (pdfAttachments?.length > 0) {
      try {
        pdfBase64Data = await mergePDFs(pdfBase64Data, pdfAttachments, isBrowser());
      } catch (error) {
        console.error("Error merging PDFs:", error);
        // Fall back to original PDF if merge fails
      }
    }
  }

  return pdfBase64Data;
};

export { pdfFrontBase64, pdfBackBase64, pdfBase64 };
