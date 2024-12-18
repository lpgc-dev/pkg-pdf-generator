import genFrontPdf from "./components/frontEnd";
import genBackPdf from "./components/backEnd";

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

export { pdfFrontBase64, pdfBackBase64, pdfBase64 };
