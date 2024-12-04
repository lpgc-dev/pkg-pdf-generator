// index.js
const {pdfBase64, runPdfGenerator} = require('./genPDF.js');
/*
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
//const readJson = require('./readJson.js');


app.get('/', async (req, res) => {
	try {
		//const jsonLayout = await readJson('sample_1.json');
        const jsonData = await readJson('data/sample_1.json');

        //directly send pdf to client for testing
        await runPdfGenerator(jsonLayout, jsonData, "direct", res);


        //base64 pdf and send to client
        //const pdfBase64 = await runPdfGenerator(jsonLayout, jsonData, "buffer");
        //res.send('Buffer PDF has been sent to client.');    
       // console.log(pdfBase64);

	} catch (error) {
		console.error('Error processing request:', error);
		res.status(500).send('Error processing request');
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
*/
module.exports = {
    pdfBase64
}