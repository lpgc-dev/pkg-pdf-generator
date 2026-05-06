# 2. Layout structure

Every layout file is a single JSON object with **six top-level sections**. Always the same six. Memorise these names — you will write them in every layout.

```json
{
  "static":  { },
  "styles":  { },
  "setting": { },
  "header":  { },
  "footer":  { },
  "body":    { }
}
```

Below is what each one is for, with one-line examples. Detail comes in later chapters.

---

## `static` — values stored *inside* the layout

A bag of values you can reference from anywhere in the layout, without putting them in the data file. Useful for things that are part of the *design*, not the *content* — a company logo, a fixed footer line, an icon set you reuse on every page.

```json
"static": {
  "logo": "data:image/png;base64,iVBORw0K...",
  "companyName": "ACME Corp"
}
```

You reference these by writing the path with a leading `"$"`:

```json
{ "type": "text", "value": ["$", "companyName"] }
```

If you don't need anything static, leave it empty: `"static": {}`.

---

## `styles` — reusable style definitions

A dictionary of named styles. Anywhere a piece of text accepts a `"style"`, you can refer to one of these by name.

```json
"styles": {
  "title":  { "fontSize": 18, "bold": true, "color": "#222" },
  "label":  { "fontSize": 10, "color": "#666" },
  "danger": { "color": "white", "fillColor": "#cc0000", "bold": true }
}
```

Then in the body:

```json
{ "type": "text", "value": "Welcome", "style": "title" }
```

Full list of style properties is in [Chapter 4: Styles](./04-styles.md).

If you don't define any styles you can leave it empty: `"styles": {}` — the document will still render with sensible defaults.

---

## `setting` — page settings

Things that apply to **the whole document**: page size, orientation, page margins, default font size.

```json
"setting": {
  "size": "LETTER",
  "orientation": "portrait",
  "margin": [40, 60, 40, 60],
  "fontSize": 11
}
```

All options are listed in [Chapter 3: Page settings](./03-page-settings.md).

---

## `header` — what appears at the top of every page

A small section drawn at the top of *every* page (not just page 1). Most often holds the company logo, document title, page subtitle.

```json
"header": {
  "margin": [40, 20, 40, 0],
  "contents": [
    { "type": "text", "value": "Daily Report", "alignment": "center", "style": "title" }
  ]
}
```

If you don't want a header, leave `"contents": []`. Details and pagination tricks live in [Chapter 10: Headers and footers](./10-headers-and-footers.md).

---

## `footer` — what appears at the bottom of every page

Same idea as the header but at the bottom. Can show page numbers, a divider line, a fixed message.

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [],
  "showPageNumber": true,
  "showDivider": true
}
```

Details in [Chapter 10: Headers and footers](./10-headers-and-footers.md).

---

## `body` — the actual document content

This is where most of your work goes. The body has a single property called `content`, which is an **array of elements stacked top to bottom**.

```json
"body": {
  "content": [
    { "type": "text", "value": "Section 1", "style": "title" },
    { "type": "text", "value": "Some intro paragraph here." },
    { "type": "table", "...": "..." },
    { "type": "divider" },
    { "type": "signature", "...": "..." }
  ]
}
```

Each item in the array has a `"type"` and the rest of the properties depend on what type it is. The chapters from 6 onwards walk through every type.

---

## The bare-minimum skeleton

Copy this whenever you start a new layout. Every section is present but empty, so the file is valid:

```json
{
  "static": {},
  "styles": {},
  "setting": {
    "size": "LETTER",
    "orientation": "portrait",
    "margin": [40, 60, 40, 60]
  },
  "header": { "margin": [0, 0, 0, 0], "contents": [] },
  "footer": { "margin": [0, 0, 0, 0], "contents": [] },
  "body": {
    "content": []
  }
}
```

From here, you typically add content into `body.content`, then define styles in `styles` as you need them, then put a logo or two into `static`, and add a header/footer at the end.

---

## A common mistake

The order of keys inside the object **does not matter** — JSON is unordered. This is fine:

```json
{ "body": {...}, "setting": {...}, "static": {...}, "styles": {...}, "header": {...}, "footer": {...} }
```

But all six keys must exist, and the **arrays inside them** are read in order. The body's `content` array is rendered top-to-bottom in the order you write it. Reordering the array reorders the document.

---

Continue → [3. Page settings](./03-page-settings.md)
