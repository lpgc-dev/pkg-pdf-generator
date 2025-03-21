import { pdfBase64 } from "./index.js";
import { readFileSync, writeFileSync } from 'fs';

const invoiceLayout = JSON.parse(readFileSync('./test/testLayout/invoiceLayout.json', 'utf8'));
const invoiceData = JSON.parse(readFileSync('./test/data/invoiceLayoutData.json', 'utf8'));
const testLayout = JSON.parse(readFileSync('./test/testLayout/invoiceLayout copy.json', 'utf8'));
const testData = JSON.parse(readFileSync('./test/data/invoiceLayoutData copy.json', 'utf8'));

const pdf = await pdfBase64(invoiceLayout, invoiceData);
// const pdf = await pdfBase64(testLayout, testData);
writeFileSync('output.pdf', Buffer.from(pdf.split(',')[1], 'base64'));