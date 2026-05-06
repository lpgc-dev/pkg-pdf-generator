# 7. Tables

Tables are the workhorse element. Most "real" PDFs are mostly made of tables — even when they don't look like tables — because tables let you line things up.

This is the longest chapter, but it's worth reading start to finish. Tables can be as simple as a 2-column "label / value" grid, or as complex as a dynamic, repeating, nested grid filled from data.

---

## The shape of a table

```json
{
  "type": "table",
  "widths": ["*", "*"],
  "layout": "noBorders",
  "margin": [0, 0, 0, 0],
  "body": {
    "header": [],
    "rows": []
  }
}
```

The minimum is: a `type`, a `widths` array, and a `body` with `rows` inside.

- `widths` — how wide each column is.
- `body.header` — the optional header row (one per column).
- `body.rows` — the body rows (each row is an array of cells).

### Column widths

`widths` has one entry per column.

| Value | Meaning |
|-------|---------|
| `"*"` | Stretch this column to fill remaining space. Most used. |
| `"auto"` | Size to fit the content. Useful for narrow columns like icons or labels. |
| `"30%"` | Percentage of the page width. |
| `120` (number) | Fixed width in points. |

Examples:

```json
"widths": ["*"]                   // one column, fills the page
"widths": ["auto", "*"]           // narrow label, wide value
"widths": ["*", "*", "*"]         // three equal columns
"widths": ["30%", "*", "auto"]    // mixed
"widths": [100, "*", 50]          // fixed left, stretchy middle, fixed right
```

Number of entries here must equal the number of cells in each row.

### Borders / table layout

`layout` controls how borders are drawn.

| Value | Look |
|-------|------|
| (omitted) or `null` | Default — full borders around every cell. |
| `"noBorders"` | No borders at all. Use this when you want a table just for alignment. |
| `"headerLineOnly"` | A line only under the header row. |
| `"lightHorizontalLines"` | Light horizontal lines between rows. |
| `"outside"` | Border only on the outside of the whole table. |

Most layouts are either `"noBorders"` (for layout-only tables) or full borders (for actual tabular data).

### Margin

`"margin": [left, top, right, bottom]` — whitespace around the table. Standard `[0, 0, 0, 0]` to no top/bottom space, `[0, 10, 0, 10]` to space it out from neighbouring elements.

---

## Static tables

A "static" table has its content written directly in the layout. Nothing comes from the data file.

### Example: a 2-column label/value grid for fixed labels

```json
{
  "type": "table",
  "widths": ["30%", "*"],
  "layout": "noBorders",
  "body": {
    "rows": [
      [
        { "type": "text", "value": "Customer:", "style": "label" },
        { "type": "text", "value": ["customer", "name"], "style": "value" }
      ],
      [
        { "type": "text", "value": "Order #:", "style": "label" },
        { "type": "text", "value": ["orderNumber"], "style": "value" }
      ],
      [
        { "type": "text", "value": "Date:", "style": "label" },
        { "type": "text", "value": ["orderDate"], "style": "value",
          "format": { "type": "date", "value": "MM/DD/YYYY" } }
      ]
    ]
  }
}
```

Each row is an array of two cells. The first cell has a fixed label, the second pulls from the data. No borders. No header.

### Adding a header row

A header row goes in `body.header`. It's just an array of cells (one per column):

```json
{
  "type": "table",
  "widths": ["*", "*", "auto"],
  "body": {
    "header": [
      { "type": "text", "value": "Item", "style": "tableHead" },
      { "type": "text", "value": "Description", "style": "tableHead" },
      { "type": "text", "value": "Price", "style": "tableHead" }
    ],
    "rows": [
      [
        { "type": "text", "value": "Widget A" },
        { "type": "text", "value": "Standard widget" },
        { "type": "text", "value": "9.99", "alignment": "right", "prefix": "$" }
      ]
    ]
  }
}
```

By default the header row is treated as a "table header" — if the table breaks across pages, the header repeats on the next page. You can change this with `headerRows`:

| Property | Default | Meaning |
|----------|---------|---------|
| `headerRows` | `1` | How many top rows to treat as header rows. Set to `0` if you don't want repetition. |
| `keepWithHeaderRows` | – | Number of rows below the header that should stay attached to the header (don't separate by page break). |
| `dontBreakRows` | `false` | When `true`, prevents a single row from being split across two pages. |

---

## Dynamic tables driven by data

This is what makes tables powerful. Instead of writing a row for each item, you write **one row template**, and the package repeats it for every item in a data array.

You do this with the `rowData` property.

### Example: line items from data

Suppose your data is:

```json
{
  "items": [
    { "name": "Widget",     "qty": 3, "price": 9.99 },
    { "name": "Gadget",     "qty": 1, "price": 19.50 },
    { "name": "Thingamajig","qty": 2, "price": 4.25 }
  ]
}
```

A dynamic table:

```json
{
  "type": "table",
  "widths": ["*", "auto", "auto"],
  "rowData": ["items"],
  "body": {
    "header": [
      { "type": "text", "value": "Item",     "style": "tableHead" },
      { "type": "text", "value": "Qty",      "style": "tableHead" },
      { "type": "text", "value": "Price",    "style": "tableHead" }
    ],
    "rows": [
      [
        { "type": "text", "value": ["name"]  },
        { "type": "text", "value": ["qty"],  "alignment": "right" },
        { "type": "text", "value": ["price"],"alignment": "right", "prefix": "$", "toFixed": 2 }
      ]
    ]
  }
}
```

What's happening here:

- `rowData: ["items"]` says "look at the `items` array in the data".
- `body.rows` has only **one row template** — the package will use it as a stamp, applying it once per item in the array.
- Inside the template, `["name"]`, `["qty"]`, `["price"]` no longer mean "the top of the data file" — they mean "the **current item's** name/qty/price".

The result: a 3-row table, one per item.

### Header data from the data file

Just like rows, you can fill the header row from data:

```json
{
  "type": "table",
  "widths": ["*", "*"],
  "headerData": ["columnTitles"],
  "body": {
    "header": [
      { "type": "text", "style": "tableHead" },
      { "type": "text", "style": "tableHead" }
    ],
    "rows": [...]
  }
}
```

If your data has `columnTitles: ["Name", "Email"]`, the header row picks up those values in order.

### Skipping empty rows automatically

Sometimes a data array has placeholder/empty rows you don't want printed. Use `ignoreEmpty`:

```json
{
  "type": "table",
  "rowData": ["findings"],
  "ignoreEmpty": {
    "enable": true,
    "value": ["severity", "description"]
  },
  "body": { ... }
}
```

This says: drop any row where **all** of `severity` AND `description` are empty/missing. The row is kept if at least one of those fields has a value.

---

## Nested tables

A cell inside a table can itself be a table. This is how you build complex layouts (think: a row that has a 2-column sub-grid inside one of its cells).

```json
{
  "type": "table",
  "widths": ["*"],
  "layout": "noBorders",
  "body": {
    "rows": [
      [
        {
          "type": "table",
          "widths": ["auto", "*"],
          "layout": "noBorders",
          "body": {
            "rows": [
              [
                { "type": "text", "value": "Project:", "style": "label" },
                { "type": "text", "value": ["projectName"], "style": "value" }
              ]
            ]
          }
        }
      ]
    ]
  }
}
```

You can nest as deep as you like. It's a useful technique for complex form layouts.

When the outer table is dynamic (`rowData`), the nested table inherits the row's data context — so paths inside the nested table look up fields **of the current row**, not the root data.

---

## Mixing static and dynamic — `static + iteration`

A common pattern: the table starts with a fixed first row, then iterates a list. There are two ways to do this:

1. **Two tables stacked** — a static one above a dynamic one. Usually clearer.
2. **A dynamic table with `headerRows` set high enough** to include the fixed rows. More compact but harder to read.

Prefer option 1 unless you have a specific reason.

---

## Cell content can be more than text

A cell can contain **any element** — text, image, svg, qr, even another table. The package figures it out from the element's `type`.

```json
{
  "type": "table",
  "widths": ["auto", "*"],
  "layout": "noBorders",
  "body": {
    "rows": [
      [
        { "type": "image", "value": ["$", "logo"], "width": 60 },
        { "type": "text",  "value": ["companyName"], "style": "title" }
      ]
    ]
  }
}
```

---

## Quick reference

| Property | Where | What it does |
|----------|-------|--------------|
| `type` | required | Always `"table"`. |
| `widths` | required | Column widths array. Length = number of cells per row. |
| `body.header` | optional | Array of cells (one per column) drawn as the table header. |
| `body.rows` | required | Array of rows. Each row is an array of cells. |
| `rowData` | optional | A path into data. If set, `body.rows` is treated as a template. |
| `headerData` | optional | A path into data. If set, header cells pick up values from there. |
| `ignoreEmpty` | optional | Skip rows where listed fields are all empty. |
| `layout` | optional | Border style. See list above. |
| `margin` | optional | `[left, top, right, bottom]`. |
| `headerRows` | optional | How many top rows are repeated on page break. Default 1 if header exists. |
| `keepWithHeaderRows` | optional | Keep N body rows attached to the header (no break in between). |
| `dontBreakRows` | optional | If `true`, no single row gets split across pages. |
| `widths` items | per column | `"*"`, `"auto"`, `"30%"`, or a number. |

---

Continue → [8. Layout helpers (`columns`, `stack`, `array`)](./08-layout-helpers.md)
