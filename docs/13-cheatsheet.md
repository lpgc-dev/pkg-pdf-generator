# 13. Cheatsheet

A one-page reference. Use this once you know your way around — it's not a tutorial.

## Layout skeleton

```json
{
  "static":  {},
  "styles":  {},
  "setting": { "size": "LETTER", "orientation": "portrait", "margin": [40, 60, 40, 60] },
  "header":  { "margin": [0,0,0,0], "contents": [] },
  "footer":  { "margin": [0,0,0,0], "contents": [] },
  "body":    { "content": [] }
}
```

## Value forms

| Form | Source |
|------|--------|
| `"value": "Hello"` | Literal |
| `"value": ["a","b"]` | `data.a.b` |
| `"value": ["$","a","b"]` | `static.a.b` |

## Style properties (most-used)

`fontSize`, `bold`, `italics`, `alignment`, `color`, `background`, `fillColor`, `lineHeight`, `decoration`, `decorationStyle`, `decorationColor`, `noWrap`, `margin: [L,T,R,B]`.

## Page settings

| Key | Default | Notes |
|-----|---------|-------|
| `size` | `LETTER` | A0–A6, B0–B10, LEGAL, TABLOID, EXECUTIVE, FOLIO, etc. |
| `orientation` | `portrait` | or `landscape` |
| `margin` | `[20,60,40,60]` | `[L,T,R,B]` in points |
| `fontSize` | `12` | Default for body text |
| `fontMargin` | `[0,0,0,0]` | Default text margin |
| `normalizeMergedPages` | `false` | Re-fit attachments to your page size |

## Element types

| `type` | Where | Purpose |
|--------|-------|---------|
| `text` | body, cells, header, footer | Words |
| `image` | anywhere | JPG/PNG (base64 data URI) |
| `svg` | anywhere | SVG image / signature |
| `qr` | anywhere | QR code |
| `divider` | body, cells | Horizontal line |
| `table` | anywhere | Grid (static or data-driven via `rowData`) |
| `columns` | body, cells | Side-by-side layout |
| `stack` | cells, columns | Vertical group |
| `signature` | body, columns | Multi-signer grid |
| `array` | body | Repeat blocks per data item |

## Text element extras

| Property | Effect |
|----------|--------|
| `prefix` / `suffix` | Wrap value with text (literal or path) |
| `afterPrefix` / `beforeSuffix` | Separator between value and prefix/suffix |
| `format: { type: "date", value: "MM/DD/YYYY" }` | Format dates with day.js tokens |
| `toFixed: 2` | Round numeric value to N decimals |
| `condition: { type, <val>, isNUll }` | Switch value/style/element by data |
| `visible: "expr"` | Show only when expression is true |

## Date format tokens (day.js)

`YYYY YY MM M MMM MMMM DD D Do HH H mm m ss A a`

Examples: `MM/DD/YYYY`, `DD-MMM-YYYY`, `MMMM Do, YYYY`, `YYYY-MM-DD HH:mm`.

## Table cheatsheet

```json
{
  "type": "table",
  "widths": ["auto","*","30%",100],
  "layout": "lightHorizontalLines",
  "rowData": ["items"],
  "headerData": ["columnTitles"],
  "ignoreEmpty": { "enable": true, "value": ["sev","desc"] },
  "headerRows": 1,
  "keepWithHeaderRows": 1,
  "dontBreakRows": true,
  "margin": [0,0,0,0],
  "body": {
    "header": [ ... cells ... ],
    "rows":   [ [ ... cells ... ] ]
  }
}
```

`layout` values: `null` (default with borders), `noBorders`, `headerLineOnly`, `lightHorizontalLines`, `outside`, `onlyVerticalLinesWithClosedBorders`.

`widths` items: `"*"`, `"auto"`, `"30%"`, or a number (points).

## Signature cheatsheet

```json
{
  "type": "signature",
  "rowData": ["attendees"],
  "signature": ["signatureData"],
  "displayNames": ["attendeeName"],
  "title": "Signatures",
  "showTitle": true,
  "showTitleDivider": false,
  "titleFontSize": 12,
  "titleMargin": [0,5,0,5],
  "placeholder": "No signatures available",
  "maxItemsPerRow": 2,
  "minItemsPerRow": 2,
  "boxGap": 3,
  "attendeeType": false
}
```

`displayNames` can also be `{ "path":["name"], "prefix":"...", "suffix":"..." }`.

## Footer extras

```json
"footer": {
  "margin": [40,0,40,20],
  "contents": [...],
  "showPageNumber": true,
  "showDivider": true,
  "leftFooter": { "type": "table", ... }
}
```

A cell with `"showOnlyOnLastPage": true` is invisible except on the final page.

## Visibility expressions

Operators: `===`, `!==`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `!`, `.length`, `.field`.

Examples: `"isPaid"`, `"!cancelled"`, `"items.length > 0"`, `"customer.country === 'US' && total > 100"`.

## Condition (value switching)

```json
"condition": {
  "type": [true, false],
  "true":  { "value": "[YES]" },
  "false": { "value": "[NO]" },
  "isNUll":{ "value": "n/a" }
}
```

Each branch can also include `"style"`, or be a full element (e.g. a `table`).

## Merging external PDFs

```json
"additionalContent": [
  { "type": "conditional_mergePdf", "value": ["attachments"] }
]
```

Attachment item: `{ "url": "..." }` or `{ "value": "data:application/pdf;base64,...", "type": "application/pdf", "name": "permit.pdf" }`.

Image attachments (JPG/PNG by URL) are wrapped onto PDF pages automatically.

---

This is the end of the guide. The rest is in the [examples](./examples/) folder — that's where you'll see all of these features in real, runnable layouts.
