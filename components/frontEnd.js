const pdfDefinition = require('./pdfComp'); // PDF layout definition
import pdfMake from 'pdfmake/build/pdfmake';
import roboto from '../assets/roboto/roboto'
pdfMake.vfs = roboto;

const genFrontPdf = async (layout, data) => {
	const pdfDef = pdfDefinition(layout, data);
	return new Promise((resolve, reject) => {
		pdfMake.createPdf(pdfDef).getBase64(base64 => {
			const base64WithMimeType = `data:application/pdf;base64,${base64}`;
			resolve(base64WithMimeType);
		});
	});
}

module.exports = genFrontPdf;
