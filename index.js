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
function findAndSetKeyInObject(
  obj,
  keyToFind,
  newValue,
  searchInPrivate = false
) {
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

const LETTER_PORTRAIT = { width: 612, height: 792 };
const LETTER_LANDSCAPE = { width: 792, height: 612 };

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

const dataUriToBytes = (dataUriOrBase64Raw) => {
  const raw = String(dataUriOrBase64Raw || "");
  const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
  if (!base64) return null;
  return isBrowser()
    ? Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    : Buffer.from(base64, "base64");
};

const attachmentToPdfBytes = async (attachment) => {
  if (!attachment) return null;
  if (attachment.url) return await getNetworkAttachment(attachment.url);
  if (attachment.value && attachment.type === "application/pdf") {
    return dataUriToBytes(attachment.value);
  }
  return null;
};

const addNormalizedPages = async (outDoc, srcBytes, targetSize, options = {}) => {
  if (!srcBytes) return;
  const srcDoc = await PDFDocument.load(srcBytes);
  const pages = srcDoc.getPages();

  for (const page of pages) {
    const embedded = await outDoc.embedPage(page);
    const { width: srcW, height: srcH } = page.getSize();

    const targetW = targetSize?.width ?? LETTER_PORTRAIT.width;
    const targetH = targetSize?.height ?? LETTER_PORTRAIT.height;
    const margin = Number.isFinite(options?.margin) ? options.margin : 12;

    // Prefer "fit-to-width" so pages expand more, but clamp if height would overflow.
    const widthScale = (targetW - margin * 2) / srcW;
    const heightScale = (targetH - margin * 2) / srcH;
    const scale = Math.min(widthScale, heightScale);

    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const x = (targetW - drawW) / 2;
    const y = (targetH - drawH) / 2;

    const newPage = outDoc.addPage([targetW, targetH]);
    newPage.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
  }
};

const mergePDFsNormalizedToLetter = async (
  pdfBase64Data,
  pdfAttachments,
  options = {}
) => {
  const outDoc = await PDFDocument.create();

  const mainBytes = dataUriToBytes(pdfBase64Data);
  if (!mainBytes) return pdfBase64Data;

  // Keep the main PDF pages exactly as generated.
  const mainDoc = await PDFDocument.load(mainBytes);
  const mainPages = mainDoc.getPages();
  const targetSize =
    options?.targetSize ||
    (mainPages?.[0]
      ? (() => {
          const { width, height } = mainPages[0].getSize();
          return { width, height };
        })()
      : options?.orientation === "landscape"
        ? LETTER_LANDSCAPE
        : LETTER_PORTRAIT);

  const copiedMainPages = await outDoc.copyPages(
    mainDoc,
    mainPages.map((_, idx) => idx)
  );
  for (const p of copiedMainPages) outDoc.addPage(p);

  // attachments
  for (const attachment of pdfAttachments || []) {
    const bytes = await attachmentToPdfBytes(attachment);
    await addNormalizedPages(outDoc, bytes, targetSize, { margin: 12 });
  }

  const mergedBytes = await outDoc.save();

  // Avoid `btoa(String.fromCharCode(...bytes))` which can overflow the call stack for large PDFs.
  if (isBrowser()) {
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  const base64 = Buffer.from(mergedBytes).toString("base64");
  return `data:application/pdf;base64,${base64}`;
};

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
      if (!attachment) continue;

      if (attachment.url) {
        const attachmentBuffer = await getNetworkAttachment(attachment.url);
        if (attachmentBuffer) await merger.add(attachmentBuffer);
      } else if (attachment.value && attachment.type === "application/pdf") {
        const base64Raw = attachment.value.includes(",")
          ? attachment.value.split(",")[1]
          : attachment.value;
        const attachmentBuffer = Buffer.from(base64Raw, "base64");
        if (attachmentBuffer.length > 0) await merger.add(attachmentBuffer);
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
        const pdfAttachments = getValueFromPath(data, content.value);

        if (pdfAttachments?.length > 0) {
          try {
            const shouldNormalize = layout?.setting?.normalizeMergedPages === true;
            pdfBase64Data = shouldNormalize
              ? await mergePDFsNormalizedToLetter(pdfBase64Data, pdfAttachments, {
                  orientation: layout?.setting?.orientation,
                })
              : await mergePDFs(pdfBase64Data, pdfAttachments, isBrowser());
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
            const shouldNormalize = layout?.setting?.normalizeMergedPages === true;
            pdfBase64Data = shouldNormalize
              ? await mergePDFsNormalizedToLetter(pdfBase64Data, pdfAttachments, {
                  orientation: layout?.setting?.orientation,
                })
              : await mergePDFs(pdfBase64Data, pdfAttachments, isBrowser());
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
