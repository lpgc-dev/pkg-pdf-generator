// index.js
const runPdfGenerator = require('./genPDF.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const readJson = require('./readJson.js');


app.get('/', async (req, res) => {
	try {
		const jsonLayout = await readJson('sample_1.json');
		const jsonData = await readJson('data/sample_1.json');

		// Choose output method based on a query parameter
		const outputToFile = req.query.output === 'file';
		// Check if 'output=file' is in the query string

		// Run the PDF generator with the selected output option
		await runPdfGenerator(jsonLayout, jsonData, res, outputToFile);
		if (outputToFile) {
			res.send('PDF has been saved to file.');
		}
	} catch (error) {
		console.error('Error processing request:', error);
		res.status(500).send('Error processing request');
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
