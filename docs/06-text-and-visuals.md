# 6. Text and visuals

These are the building-block elements you'll use most often. Each one is a JSON object with a `"type"` and some properties. They go inside `body.content`, or inside a table cell, or inside a column.

This chapter covers:

- [`text`](#text) — words on the page
- [`image`](#image) — JPG / PNG images
- [`svg`](#svg) — SVG graphics, including signatures
- [`qr`](#qr) — QR codes
- [`divider`](#divider) — horizontal lines

> Tables, columns, signatures, and arrays are bigger topics — they have their own chapters.

---

## `text`

The most common element. A piece of text, optionally styled.

```json
{
  "type": "text",
  "value": "Hello, world!",
  "alignment": "left",
  "style": "title"
}
```

| Property | Required | Notes |
|----------|----------|-------|
| `type` | yes | Always `"text"`. |
| `value` | yes | Literal string, or a data path (see chapter 5). |
| `style` | no | Name of a style from the `styles` section. |
| `alignment` | no | `"left"`, `"center"`, `"right"`, `"justify"`. Default `"left"`. |
| `prefix` / `suffix` | no | Wrap value with text. See chapter 5. |
| `format` | no | Format dates. See chapter 5. |
| `toFixed` | no | Round numbers. See chapter 5. |
| `condition` | no | Switch the value based on the data. See [chapter 11](./11-show-and-hide.md). |
| `visible` | no | Show/hide based on a rule. See chapter 11. |

You can also override any single style property right on the element:

```json
{ "type": "text", "value": "Big red note", "fontSize": 16, "color": "red", "bold": true }
```

### Common patterns

**A heading**:
```json
{ "type": "text", "value": "Daily Report", "style": "title", "alignment": "center" }
```

**A label + value pair** (often used inside table rows):
```json
{ "type": "text", "value": "Customer:", "style": "label" }
{ "type": "text", "value": ["customer", "name"], "style": "value" }
```

**A formatted total**:
```json
{ "type": "text", "value": ["total"], "toFixed": 2, "prefix": "$", "alignment": "right" }
```

---

## `image`

Inserts an image. The image must be a **base64-encoded data URI** of a JPG or PNG (or come from `static`, where it's stored as base64).

```json
{
  "type": "image",
  "value": ["$", "logo"],
  "width": 120,
  "alignment": "right"
}
```

| Property | Required | Notes |
|----------|----------|-------|
| `type` | yes | Always `"image"`. |
| `value` | yes | A data URI string (`"data:image/png;base64,..."`), or a path that resolves to one. Most often `["$", "logo"]` from static. |
| `width` | sometimes | Width in points. |
| `height` | sometimes | Height in points. |
| `fit` | optional | An array `[maxWidth, maxHeight]` that scales the image to fit a box without distorting it. |
| `alignment` | no | `"left"`, `"center"`, `"right"`. |

You should specify either `width`, `height`, or `fit` — otherwise the image renders at its natural pixel size, which is rarely what you want.

### Examples

**Logo at the top**:
```json
{ "type": "image", "value": ["$", "companyLogo"], "width": 100, "alignment": "left" }
```

**Photo that fits a box without overflowing**:
```json
{ "type": "image", "value": ["photo"], "fit": [400, 250], "alignment": "center" }
```

### Where do I get the base64 string from?

If your data file holds a photo URL or photo upload, the system providing the data should already convert images to base64 strings before they reach the PDF generator. If you're manually crafting test data, an online "image to base64" converter works for testing. The result starts with `data:image/png;base64,...` or `data:image/jpeg;base64,...`.

---

## `svg`

Inserts an SVG image. SVG is a text-based image format — great for logos, icons, signatures.

```json
{
  "type": "svg",
  "value": ["signatureData"],
  "width": 200,
  "height": 80,
  "alignment": "left"
}
```

| Property | Required | Notes |
|----------|----------|-------|
| `type` | yes | Always `"svg"`. |
| `value` | yes | An SVG string (starts with `<svg>`), or a base64 data URI like `data:image/svg+xml;base64,...`, or a path resolving to one. |
| `width` | no | Width in points. |
| `height` | no | Height in points. |
| `fit` | no | Array `[maxWidth, maxHeight]`. |
| `alignment` | no | `"left"`, `"center"`, `"right"`. |

The element auto-decodes base64 data URIs, so signature data captured from a "draw your signature" widget can be dropped in directly.

---

## `qr`

A QR code generated from any string.

```json
{
  "type": "qr",
  "value": ["orderNumber"],
  "fit": "80",
  "foreground": "#222222",
  "background": "#ffffff"
}
```

| Property | Required | Notes |
|----------|----------|-------|
| `type` | yes | Always `"qr"`. |
| `value` | yes | What to encode — literal string, or a path. |
| `fit` | no | Size of the QR code (height/width in points). Number or numeric string. |
| `foreground` | no | Colour of the dots. Default black. |
| `background` | no | Colour behind the dots. Default white. |
| `alignment` | no | `"left"`, `"center"`, `"right"`. |

QR codes work for any text — URLs, product IDs, JSON, plain words.

---

## `divider`

A horizontal line. Useful as a section separator.

```json
{ "type": "divider" }
```

That's the minimum. Customise with:

```json
{
  "type": "divider",
  "lineWidth": 0.5,
  "color": "#cccccc",
  "width": 480,
  "margin": [0, 6, 0, 6]
}
```

| Property | Notes |
|----------|-------|
| `lineWidth` | Thickness of the line. Default `1`. |
| `color` | Line colour. Default `"black"`. |
| `width` | Length of the line in points. If unspecified, draws very wide (~752pt) so it spans most of the page. |
| `margin` | `[left, top, right, bottom]` whitespace. Most-used field on a divider. |

---

## A small example using only this chapter's elements

```json
{
  "static": {
    "logo": "data:image/png;base64,iVBORw0KG..."
  },
  "styles": {
    "title": { "fontSize": 22, "bold": true, "alignment": "center" },
    "body":  { "fontSize": 11, "alignment": "justify" }
  },
  "setting": { "size": "LETTER", "orientation": "portrait", "margin": [40, 40, 40, 40] },
  "header": { "margin": [0, 0, 0, 0], "contents": [] },
  "footer": { "margin": [0, 0, 0, 0], "contents": [] },
  "body": {
    "content": [
      { "type": "image", "value": ["$", "logo"], "width": 80, "alignment": "center" },
      { "type": "text",  "value": "Welcome to ACME Corp", "style": "title" },
      { "type": "divider", "color": "#cccccc", "margin": [0, 8, 0, 8] },
      { "type": "text",  "value": ["welcomeMessage"], "style": "body" },
      { "type": "qr",    "value": ["referenceUrl"], "fit": "100", "alignment": "center" }
    ]
  }
}
```

With the matching data:

```json
{
  "welcomeMessage": "Thanks for signing up — we're glad to have you on board.",
  "referenceUrl": "https://acme.example.com/welcome/abc123"
}
```

---

Continue → [7. Tables](./07-tables.md)
