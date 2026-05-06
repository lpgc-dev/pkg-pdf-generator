# 10. Headers and footers

The `header` and `footer` sections of a layout draw on **every page** of the PDF — at the top and bottom respectively. They're optional. If you don't need either, leave their `contents` empty.

## How they're rendered

The header and footer are not part of the body. They sit in the **page margins** — the whitespace defined by `setting.margin`. So if your top page margin is 60 points, the header has 60 points to live in.

Common pitfall: if your header is taller than the top margin, body content will overlap with it. Always make sure your top margin is bigger than the header content.

---

## The `header` section

```json
"header": {
  "margin": [40, 20, 40, 0],
  "contents": [
    { "type": "image", "value": ["$", "logo"], "width": 60 },
    { "type": "text",  "value": "Daily Operations Report", "alignment": "right", "style": "title" }
  ]
}
```

The header has:

| Property | Notes |
|----------|-------|
| `margin` | `[left, top, right, bottom]` whitespace around the header itself. |
| `contents` | Array of elements. **They're laid out as columns** — side by side, not stacked. |

If you want to stack things vertically inside a header, wrap them in a [`stack` element](./08-layout-helpers.md#stack).

### Example: logo on the left, title on the right

```json
"header": {
  "margin": [40, 16, 40, 0],
  "contents": [
    { "type": "image", "value": ["$", "logo"], "width": 80, "alignment": "left" },
    { "type": "text",  "value": "Daily Report", "alignment": "right", "style": "title" }
  ]
}
```

### Example: an empty header (placeholder)

If you don't want a header but still need the section present:

```json
"header": { "margin": [0, 0, 0, 0], "contents": [] }
```

---

## The `footer` section

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [
    { "type": "text", "value": "Confidential", "alignment": "left" }
  ],
  "showPageNumber": true,
  "showDivider": true
}
```

The footer has more options than the header.

| Property | Notes |
|----------|-------|
| `margin` | `[left, top, right, bottom]` around the footer. |
| `contents` | Array of elements (laid out as columns, like the header). |
| `showPageNumber` | When `true`, a `Page X of Y` label is added to the right side. |
| `showDivider` | When `true`, draws a horizontal line above the footer. |
| `leftFooter` | Optional `table` element drawn on the **left** of the page-number row. See below. |

### Page numbers

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [],
  "showPageNumber": true
}
```

This adds `Page 1 of 5` (etc.) at the bottom-right of every page.

### A divider line above the footer

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [{ "type": "text", "value": "© ACME Corp", "alignment": "center" }],
  "showDivider": true
}
```

### `leftFooter` — putting a table opposite the page number

When `showPageNumber: true` is set, a row appears with the page number on the right. By default the left side just says `LEFT` (a placeholder). To put something useful on the left, set `leftFooter` to a small table:

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [],
  "showPageNumber": true,
  "leftFooter": {
    "type": "table",
    "widths": ["auto"],
    "layout": "noBorders",
    "body": {
      "rows": [
        [ { "type": "text", "value": ["documentId"], "fontSize": 9, "color": "#666" } ]
      ]
    }
  }
}
```

Now the footer's last row shows `Doc: 12345` on the left and `Page 1 of 5` on the right.

---

## Showing something only on the last page

A useful trick: a cell inside the footer can be marked `showOnlyOnLastPage: true`. The cell still takes its space on every page, but it's only visible on the final page. Useful for a "this is the end of the document" note or a totals line.

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [
    {
      "type": "table",
      "widths": ["*"],
      "layout": "noBorders",
      "body": {
        "rows": [
          [
            {
              "type": "text",
              "value": "— End of document —",
              "alignment": "center",
              "showOnlyOnLastPage": true
            }
          ]
        ]
      }
    }
  ],
  "showPageNumber": true
}
```

The "— End of document —" line will only appear on the final page.

---

## Putting it together

A typical professional-looking footer:

```json
"footer": {
  "margin": [40, 0, 40, 20],
  "contents": [
    { "type": "text", "value": ["$", "footerNote"], "alignment": "left", "fontSize": 9, "color": "#888" }
  ],
  "showPageNumber": true,
  "showDivider": true,
  "leftFooter": {
    "type": "table",
    "widths": ["auto"],
    "layout": "noBorders",
    "body": {
      "rows": [
        [ { "type": "text", "value": ["documentId"], "prefix": "Doc #", "afterPrefix": " ", "fontSize": 9 } ]
      ]
    }
  }
}
```

Renders something like:

```
─────────────────────────────────────────────
ACME confidential — do not distribute
Doc # 47-A                          Page 1 of 3
```

---

Continue → [11. Show and hide](./11-show-and-hide.md)
