import genFrontPdf from "./components/frontEnd.js";
import genBackPdf from "./components/backEnd.js";
import PDFMerger from "pdf-merger-js";
import { PDFDocument } from "pdf-lib";

// ENUMS
const MERGE_TYPE = {
  CONDITIONAL: "conditional_mergePdf",
  MANDATORY: "mandatory_mergePdf",
};

// Utility functions
const isBrowser = () => typeof window !== "undefined";

const getValueFromPath = (obj, path) => {
  const result = path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
  return Array.isArray(result) ? result : result !== undefined ? [result] : [];
};
function findAndSetKeyInObject(obj, keyToFind, newValue, searchInPrivate = false) {
  let result = null;
  let mainKey = keyToFind;
  let property = null;

  // Handle string paths
  if (typeof keyToFind === "string") {
    [mainKey, property] = keyToFind.split(".");
  }

  function recursiveSearch(obj) {
    if (obj && typeof obj === "object") {
      if (obj.hasOwnProperty(mainKey)) {
        if (newValue !== undefined) {
          obj[mainKey] = newValue; // Set new value
        }
        // If we have a property to access, get that instead
        result = property ? obj[mainKey][property] : obj[mainKey];
        return;
      }
      for (const key in obj) {
        // Skip _private_ keys if searchInPrivate is false
        if (!searchInPrivate && key.startsWith("_private_")) {
          continue;
        }
        if (typeof obj[key] === "object") {
          recursiveSearch(obj[key]);
        }
      }
    }
  }

  recursiveSearch(obj);
  return newValue !== undefined ? obj : result;
}

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
  const image =
    blob.type === "image/jpeg"
      ? await pdfDoc.embedJpg(
          isBrowser() ? arrayBuffer : Buffer.from(arrayBuffer)
        )
      : await pdfDoc.embedPng(
          isBrowser() ? arrayBuffer : Buffer.from(arrayBuffer)
        );

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
    const mainPdfFile = base64ToFile(
      pdfBase64Data,
      "main.pdf",
      "application/pdf"
    );
    await merger.add(mainPdfFile);
    for (const attachment of pdfAttachments) {
      if (!attachment) continue;

      if (attachment.url) {
        const attachmentBuffer = await getNetworkAttachment(attachment.url);
        if (attachmentBuffer) {
          await merger.add(attachmentBuffer);
        }
      } else if (attachment.value && attachment.type === "application/pdf") {
        const attachmentBuffer = base64ToFile(
          attachment.value,
          attachment.name,
          attachment.type
        );
        await merger.add(attachmentBuffer);
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
  if (Array.isArray(layout.additionalContent)) {
    for (const content of layout.additionalContent) {
      if (content.type === MERGE_TYPE.CONDITIONAL) {
        let val = findAndSetKeyInObject(data, "add_attachments_to_pdf");
        if (val === false || val === null) {
          // Skipping mergePDFs
          continue;
        }
        const pdfAttachments = getValueFromPath(data, content.value);


        if (pdfAttachments?.length > 0) {
          try {
            pdfBase64Data = await mergePDFs(
              pdfBase64Data,
              pdfAttachments,
              isBrowser()
            );
          } catch (error) {
            console.error("Error merging PDFs:", error);
            // Fall back to original PDF if merge fails
          }
        }
      } else if (content.type === MERGE_TYPE.MANDATORY) {
        // here check if content.value is array and if array then inside it has string or obj ?
        let _isDynamicVal = false;
        if (Array.isArray(content.value) && content.value.length > 0) {
          _isDynamicVal = content.value.every(
            (item) => typeof item === "string"
          );
        }
        let pdfAttachments = [];
        if (_isDynamicVal) {
          pdfAttachments = getValueFromPath(data, content.value);
        } else {
          pdfAttachments = content.value;
        }
        if (pdfAttachments?.length > 0) {
          try {
            pdfBase64Data = await mergePDFs(
              pdfBase64Data,
              pdfAttachments,
              isBrowser()
            );
          } catch (error) {
            console.error("Error merging PDFs:", error);
            // Fall back to original PDF if merge fails
          }
        }
      }
    }
  }

  return pdfBase64Data;
};

export { pdfFrontBase64, pdfBackBase64, pdfBase64 };
