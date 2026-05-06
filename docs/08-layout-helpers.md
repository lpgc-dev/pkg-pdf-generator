# 8. Layout helpers — `columns`, `stack`, `array`

Three helper element types arrange other elements in useful ways:

- [`columns`](#columns) — place elements side by side.
- [`stack`](#stack) — group elements that travel together vertically.
- [`array`](#array) — repeat a chunk of layout for every item in a data array.

---

## `columns`

Wraps a list of elements and places them in a row. Each child gets its own column.

```json
{
  "type": "columns",
  "columnGap": 10,
  "contents": [
    { "type": "text", "value": ["leftLabel"]  },
    { "type": "text", "value": ["rightLabel"], "alignment": "right" }
  ]
}
```

| Property | Notes |
|----------|-------|
| `type` | Always `"columns"`. |
| `contents` | Array of elements, one per column. |
| `columns` | Alternative name for `contents` — both work. |
| `columnGap` | Spacing in points between columns. |
| `width` | Optional — overall width. |

### Common patterns

**Logo on the left, title on the right**:
```json
{
  "type": "columns",
  "columnGap": 12,
  "contents": [
    { "type": "image", "value": ["$", "logo"], "width": 80 },
    { "type": "text",  "value": "Daily Report", "style": "title", "alignment": "right" }
  ]
}
```

**Two tables side-by-side**:
```json
{
  "type": "columns",
  "columnGap": 20,
  "contents": [
    { "type": "table", "widths": ["*"], "body": { ... } },
    { "type": "table", "widths": ["*"], "body": { ... } }
  ]
}
```

> **Heads up:** if you put a `table` inside a `columns`, give the table `"widths": ["*"]` (or specific widths). Without that, the table defaults to a width that may overflow the column.

A `columns` can also be a **table cell** — inside a table, you can nest a `columns` if a single cell needs internal side-by-side layout.

---

## `stack`

`stack` groups elements together vertically so they're treated as one unit. Most commonly used inside table cells when a single cell needs multiple lines of content.

```json
{
  "type": "stack",
  "content": [
    { "type": "text", "value": ["customer", "name"], "style": "value" },
    { "type": "text", "value": ["customer", "company"], "style": "small" },
    { "type": "text", "value": ["customer", "email"], "style": "small" }
  ]
}
```

| Property | Notes |
|----------|-------|
| `type` | Always `"stack"`. |
| `content` | Array of elements stacked top-to-bottom. |

### When you need it

You don't strictly need `stack` at the body level — the body's `content` array already stacks elements. `stack` is useful when:

- A table cell needs multiple text rows.
- A column inside `columns` needs to contain multiple things stacked.

### Inside a table cell

```json
{
  "type": "table",
  "widths": ["auto", "*"],
  "layout": "noBorders",
  "body": {
    "rows": [
      [
        { "type": "text",  "value": "Address:", "style": "label" },
        {
          "type": "stack",
          "content": [
            { "type": "text", "value": ["address", "line1"] },
            { "type": "text", "value": ["address", "line2"] },
            { "type": "text", "value": ["address", "cityZip"] }
          ]
        }
      ]
    ]
  }
}
```

---

## `array`

`array` repeats a chunk of layout once per item in a data array. It's like `rowData` on a table but applied to **a whole section of layout**, not just rows in one table.

Use this when you need to render, say, "for each section in the report, render a heading, then a table of items, then a divider".

### Shape

```json
{
  "type": "array",
  "rowData": ["sections"],
  "content": [
    { "type": "table", ... },
    { "type": "table", ... }
  ]
}
```

| Property | Notes |
|----------|-------|
| `type` | Always `"array"`. |
| `rowData` | Path to the data array to iterate over. |
| `content` | Array of elements to repeat for each item. |

> **Note:** today the `array` element specifically supports `table` and `array` types in its `content`. If you need other element types repeated, wrap them inside a table (a 1-cell, no-border table works as a "container").

### Example

Data:

```json
{
  "sections": [
    {
      "title": "Hazards Identified",
      "items": [
        { "id": "H1", "description": "Slippery floor" },
        { "id": "H2", "description": "Loose cable"   }
      ]
    },
    {
      "title": "Corrective Actions",
      "items": [
        { "id": "A1", "description": "Mop and signpost" }
      ]
    }
  ]
}
```

Layout:

```json
{
  "type": "array",
  "rowData": ["sections"],
  "content": [
    {
      "type": "table",
      "widths": ["*"],
      "layout": "noBorders",
      "body": {
        "rows": [
          [ { "type": "text", "value": ["title"], "style": "subtitle" } ]
        ]
      }
    },
    {
      "type": "table",
      "widths": ["auto", "*"],
      "rowData": ["items"],
      "body": {
        "header": [
          { "type": "text", "value": "ID",          "style": "tableHead" },
          { "type": "text", "value": "Description", "style": "tableHead" }
        ],
        "rows": [
          [
            { "type": "text", "value": ["id"] },
            { "type": "text", "value": ["description"] }
          ]
        ]
      }
    }
  ]
}
```

For each section, you'll get: a heading line + a table of items.

Notice how `rowData` works on **two levels**:

- The outer `array` iterates `sections`.
- Inside, the second table's `rowData: ["items"]` means "items of the current section" — paths automatically resolve relative to the current item.

---

## Choosing between `columns`, `stack`, and `array`

| You want to… | Use |
|--------------|-----|
| Place 2+ elements side by side | `columns` |
| Group multiple elements vertically (especially inside a cell) | `stack` |
| Repeat a section of layout once per item in a list | `array` |
| Repeat just rows of a table | A normal `table` with `rowData` (chapter 7) |

---

Continue → [9. Signatures](./09-signatures.md)
