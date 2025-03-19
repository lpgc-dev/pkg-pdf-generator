import { pdfBase64 } from "./index.js";
import { readFileSync, writeFileSync } from 'fs';

const invoiceLayout = JSON.parse(readFileSync('./test/testLayout/invoiceLayout.json', 'utf8'));
const invoiceData = JSON.parse(readFileSync('./test/data/invoiceLayoutData.json', 'utf8'));
const testLayout = JSON.parse(readFileSync('./test/testLayout/test.json', 'utf8'));
const testData = JSON.parse(readFileSync('./test/data/sample.json', 'utf8'));

const pdf = await pdfBase64(invoiceLayout, invoiceData);
writeFileSync('output.txt', pdf);