
# PDF Generator

This project allows you to generate custom PDFs using JSON layouts and data. It uses `pdfmake` for PDF generation and `express` for serving the PDFs via an API.

## Getting Started

To get started with the custom PDF generator, follow these steps:

- Input JSON data in the `layout.json` file.

- Input JSON data in the `data.json` file.

The `layout.json` file contains the layout structure of the PDF, including the header, footer, and body content. The `data.json` file contains the data to be used in the PDF.

Once you have input the JSON data, you can start the server and generate the PDF by sending a POST request.

### Prerequisites

- Node.js
- npm

### Installation

1. Install dependencies:

    ```sh
    npm install
    ```

2. Start the server:

    ```sh
    npm start
    ```

### Running the Server

Start the server using:

### Barebones Example

```json
{
    "static": {},
    "styles": {},
    "setting": {
      "output": "pdf",
      "size": "LETTER",
      "orientation": "portrait",
      "margin": [20, 60, 40, 60]
    },
    "header": {
      "margin": [20, 10, 20, 10],
      "contents": []
    },
    "footer": {
      "margin": [20, 20, 20, 20],
      "contents": []
    },
    "body": {
      "content": []
    }
  
  }
  ```

### Explanation

- static: An object to hold static data that can be         referenced in the layout.

- styles: An object to define custom styles for different elements in the PDF.

- setting: An object to define the PDF settings:

  - `output`: The output format, set to "pdf"

  - `size`: The size of the PDF, set to "LETTER"

  - `orientation`: The orientation of the PDF, set to "portrait".
  
  - `margin`: The margins of the PDF, specified as an array [left, top, right, bottom].

- header: An object to define the header of the PDF:

  - `margin`: The margins of the header, specified as an array [left, top, right, bottom].

  - `contents`: An array to hold the contents of the header.

- footer: An object to define the footer of the PDF:

  - `margin`: The margins of the footer, specified as an array [left, top, right, bottom].

  - `contents`: An array to hold the contents of the footer.

- body: An object to define the main content of the PDF:

  - `content`: An array to hold the contents of the body.

This barebones example provides a basic structure for creating a custom PDF layout. You can add content to the `header`, `footer`, and `body` sections as needed, and define custom styles in the `styles` object.

### Layout Elements available in body

## Columns

```json
{
    "type": "columns",
    "columnGap": 10,
    "contents": []
}
```

### Explanation

- columns: An object to define a columns layout element:

  - `type`: The type of the layout element, set to "columns".

  - `columnGap`: The gap between columns, specified as a number.

  - `contents`: An array to hold the contents of the columns.

## Table

```json
{
    "type": "table",
    "widths": ["*"],
    "margin": [0, 0, 0, 0],
    "layout": null,
    "rowData": null,
    "headerData": null,
    "dontBreakRows": true,
    "keepWithHeaderRows": 1,
    "headerRows": 0
    "ignoreEmpty": {
        "enable": true,
        "value": ["severity", "likelyHood"]
    },
    "body": {
      "header": [],
      "body": []
    }
}
```

### Explanation

- table: An object to define a table layout element:
- type: The type of the layout element, set to "table".

- widths: An array to define the widths of the columns.

- margin: The margins of the table, specified as an array [left, top, right, bottom].

- layout: The layout of the table, can be set to `null`, `noBorders`,`headerLineOnly`, `lightHorizontalLines` or `outside`.

- rowData: A reference to the static or JSON data. For example, ["$", "name"] will refer to static data, while ["name"] will refer to JSON data.

- headerData:  A reference to the static or JSON data. For example, ["$", "name"] will refer to static data, while ["name"] will refer to JSON data.

- body: An object to define the body of the table:

  - header: An array to hold the contents of the table header.

  - rows: An array to hold the contents of the table body.

- ignoreEmpty: An object to define whether to ignore rows with empty values, if an entire row is empty, it will ignore the table.:
  - enable: A boolean value to enable or disable ignoring empty values.

  - value: An array of keys to ignore if the value is empty.

- dontBreakRows: A boolean value to prevent breaking rows across pages.

- keepWithHeaderRows: A number to specify the number of header rows to keep with the body.

- headerRows: A number to specify the number of header rows.

### Styles

```json
[ANY NAME] {
    "bold": true,
}
```

## Style Properties

- font: string: name of the font
- fontSize: number: size of the font in pt
- fontFeatures: string[]: array of advanced typographic features supported in TTF fonts (supported features depend on font file)
- lineHeight: number: the line height (default: 1)
- bold: boolean: whether to use bold text (default: false)
- italics: boolean: whether to use italic text (default: false)
- alignment: string: (‘left’ or ‘center’ or ‘right’ or ‘justify’) the alignment of the text
- characterSpacing: number: size of the letter spacing in pt
- color: string: the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
- background: string the background color of the text
- markerColor: string: the color of the bullets in a buletted list
decoration: string | string[]: the text decoration to apply (‘underline’ or ‘lineThrough’ or ‘overline’)
- decorationStyle: string: the style of the text decoration (‘dashed’ or ‘dotted’ or ‘double’ or ‘wavy’)
- decorationColor: string: the color of the text decoration, see color

### Object Properties

## Plain Text

```json
 {
    "type": "text",
    "value": "Sample",
    "style": "title",
    "alignment": "left"
    }
```

## Explanation

- text: An object to define a plain text layout element:

  - `type`: The type of the layout element, set to "text".

  - `value`: The text content or a reference to the static or JSON data. For example, ["$", "name"] will refer to static data, while ["name"] will refer to JSON data

  - `style`: The style to be applied to the text, referenced from the `styles` object.

  - `alignment`: The alignment of the text, can be set to "left", "center", "right", or "justify".

### Text Formated to Date

  ```json
    {
      "type": "text",
      "value": ["date"],
      "alignment": "left",
      "style": "value",
      "format": {
            "type": "date",
            "value": "MM/DD/YYYY"
        }
    }
  ```

## Explanation

- text: An object to define a text layout element formatted to date:

  - `type`: The type of the layout element, set to "text".

  - `value`: The text content or a reference to the static or JSON data. For example, ["date"] will refer to JSON data.

  - `alignment`: The alignment of the text, can be set to "left", "center", "right", or "justify".

  - `style`: The style to be applied to the text, referenced from the `styles` object.

  - `format`: An object to define the format of the text:

    - `type`: The type of the format, set to "date".

    - `value`: The format of the date, specified as a string (e.g., "MM/DD/YYYY").

### Image

```json
  {
        "type": "image",
        "value": ["$", "logo"],
        "alignment": "right",
        "width": 100,
        "height": 50
 }

```

## Explanation

- image: An object to define an image layout element:

  - `type`: The type of the layout element, set to "image".

  - `value`: The image content or a reference to the static or JSON data. For example, ["$", "logo"] will refer to static data.

  - `alignment`: The alignment of the image, can be set to "left", "center", "right", or "justify".

  - `width`: The width of the image, specified as a number.

  - `height`: The height of the image, specified as a number.

  - `fit`: The fit of the image array width and height. example `[650, 575]`

### SVG

```json
 {                    
  "type": "svg",
   "value": ["signatureData"],
    "alignment": "left",
    "width": 200,
    "height": 100
}
```

## Explanation

- svg: An object to define an SVG layout element:

  - `type`: The type of the layout element, set to "svg".

  - `value`: The SVG content or a reference to the static or JSON data. For example, ["signatureData"] will refer to JSON data.

  - `alignment`: The alignment of the SVG, can be set to "left", "center", "right", or "justify".

  - `width`: The width of the SVG, specified as a number.

  - `height`: The height of the SVG, specified as a number.

### QR

```json
{
        "type": "qr",
        "value":  ["qrCode"],
        "alignment": "left",
        "foreground": "red",
        "background": "yellow",
        "fit": "50"
}
```

## Explanation

- qr: An object to define a QR code layout element:

  - `type`: The type of the layout element, set to "qr".

  - `value`: The QR code content or a reference to the static or JSON data. For example, ["qrCode"] will refer to JSON data.

  - `alignment`: The alignment of the QR code, can be set to "left", "center", "right", or "justify".

  - `foreground`: The foreground color of the QR code, specified as a string (e.g., "red").

  - `background`: The background color of the QR code, specified as a string (e.g., "yellow").

  - `fit`: The size of the QR code, specified as a number.

### Signature

```json
 {
            "type": "signature",
            "title": "Signature",
            "rowData": ["attendees"],
            "signature": ["signatureData"],
            "placeholder": "No signatures available",
            "displayNames": ["attendeeName"],
            "itemsPerRow": 2
          }
```

## Explanation

- signature: An object to define a signature layout element:

- `type`: The type of the layout element, set to "signature".

- `title`: The title of the signature element.

- `rowData`: A reference to the JSON data. For example, ["attendees"] will refer to JSON data.

- `signature`: A reference to the JSON data. For example, ["signatureData"] will refer to JSON data.

- `placeholder`: The placeholder text to display if no signatures are available.

- `displayNames`: reference to the JSON data. For example, ["attendeeName"] will refer to JSON data.

- `itemsPerRow`: The number of signature items to display per row.

### Array

```json
{
    "type": "array",
    "rowData": ["data"],
    "content": []
}
```

## Explanation

- type: The type of the layout element, set to "array".
- rowData: A reference to the JSON data. For example, ["data"] will refer to JSON data array.
- content: An array to hold the contents of table.

### Others

- `"visible": "attachments.length > 0"`: To make the element visible based on the condition.(attachments is an array)

- `"visible": "isApproved"`: To make the element visible based on the condition.(isApproved is a boolean)

- `"visible": "attachments.length > 0 && isApproved"`: To make the element visible based on the condition.(attachments is an array and isApproved is a boolean)

### Output

- Output to base64 string for frontend only

```js
  const pdfBase64 = await pdfFrontBase64(jsonLayout, jsonData);
```

- Output to base64 for backend only

```js
  await pdfBackBase64(jsonLayout, jsonData);
```

- Output to detect either front or backend

```js
  await pdfBase64(jsonLayout, jsonData);
```

## Test locally

```cmd
  npm start
```

## Build
  
  ```cmd
    npm run build
  ```

### Conclusion

 This project provides a flexible and customizable way to generate PDFs using JSON layouts and data. By defining the layout structure and content in JSON format, you can easily create custom PDFs with different elements such as text, images, tables, and QR codes. The use of styles allows you to apply custom formatting to the content, making it easy to create professional-looking PDFs. With the ability to reference static and JSON data, you can dynamically generate PDFs based on different data sources.
