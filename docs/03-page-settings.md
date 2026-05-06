# 3. Page settings

Everything inside the `setting` object controls **the page itself** — size, orientation, margins, and the default font size for any text that doesn't say otherwise.

```json
"setting": {
  "size": "LETTER",
  "orientation": "portrait",
  "margin": [40, 60, 40, 60],
  "fontSize": 11,
  "fontMargin": [0, 0, 0, 0]
}
```

## `size`

The paper size. Common values:

| Value | Use case |
|-------|----------|
| `"LETTER"` | Standard US letter (8.5" × 11"). The default. |
| `"A4"` | Standard international A4. |
| `"LEGAL"` | US legal (8.5" × 14"). |
| `"TABLOID"` | 11" × 17". |
| `"EXECUTIVE"` | Smaller US executive size. |
| `"A3"`, `"A5"`, `"B4"`, `"B5"` … | Other ISO sizes — A0–A6, B0–B10 are all supported. |

If you omit `size`, you get **LETTER**.

## `orientation`

Either `"portrait"` (tall) or `"landscape"` (wide). Default is `"portrait"`.

```json
"setting": { "size": "LETTER", "orientation": "landscape", "margin": [40, 40, 40, 40] }
```

## `margin`

Whitespace around the body content. Always written as an array of **four numbers**:

```json
"margin": [left, top, right, bottom]
```

Values are in **points** (1 point = 1/72 of an inch). For US letter, 40 ≈ a half-inch.

| Recommendation | Margin |
|---------------|--------|
| Tight, lots of content | `[20, 30, 20, 30]` |
| Standard report | `[40, 60, 40, 60]` |
| Wide whitespace | `[60, 80, 60, 80]` |

The top margin needs to be **bigger than the header** otherwise the header overlaps the body. Same for bottom margin and footer. A rule of thumb: top margin ≥ header height + 20.

## `fontSize`

Default font size for any text element that doesn't specify its own. Numbers are in points.

```json
"setting": { "size": "LETTER", "fontSize": 11 }
```

If you omit `fontSize`, you get `12`.

You can override it per element or per style:

```json
{ "type": "text", "value": "Tiny disclaimer", "fontSize": 8 }
```

## `fontMargin`

Default margin around any text element. Same `[left, top, right, bottom]` shape as page margin. Most layouts leave this at `[0, 0, 0, 0]`.

## Optional advanced setting

### `normalizeMergedPages`

Only matters if you use the [merging external PDFs](./12-merging-pdfs.md) feature. When `true`, attached PDFs get scaled to match your page size. Default is `false` (attachments are appended at their original size).

```json
"setting": {
  "size": "LETTER",
  "orientation": "portrait",
  "margin": [40, 60, 40, 60],
  "normalizeMergedPages": true
}
```

---

## Putting it together

A typical real-world `setting` block looks like this:

```json
"setting": {
  "size": "LETTER",
  "orientation": "portrait",
  "margin": [40, 70, 40, 60],
  "fontSize": 11
}
```

That's the whole chapter. Page setup is deliberately small — most of the design work happens in the body.

Continue → [4. Styles](./04-styles.md)
