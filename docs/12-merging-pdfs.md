# 12. Merging external PDFs

Sometimes the PDF you're generating isn't the whole document — you also need to attach extra files: a scanned permit, photos uploaded by an inspector, a third-party safety datasheet. The package can **staple those attachments to the end** of the generated PDF for you, so the recipient gets one combined file.

This is configured in the layout under a property called `additionalContent`.

## The shape

```json
{
  "static": { ... },
  "styles": { ... },
  "setting": { ... },
  "header": { ... },
  "footer": { ... },
  "body":   { ... },

  "additionalContent": [
    { "type": "conditional_mergePdf", "value": ["attachments"] }
  ]
}
```

`additionalContent` is an **array** — you can have more than one merge step.

## The two merge types

### `conditional_mergePdf`

Look at the data path. If the result is a non-empty array, attach the items. If it's empty or missing, do nothing.

Use this when "the data may or may not include attachments".

```json
"additionalContent": [
  { "type": "conditional_mergePdf", "value": ["attachments"] }
]
```

### `mandatory_mergePdf`

Always attach. The list of items can either be:

1. A path into the data (works just like `conditional_mergePdf` but errors if missing), or
2. A literal array spelled out in the layout itself.

```json
"additionalContent": [
  { "type": "mandatory_mergePdf", "value": ["attachments"] }
]
```

Or with literal items in the layout:

```json
"additionalContent": [
  {
    "type": "mandatory_mergePdf",
    "value": [
      { "url": "https://example.com/standard-terms.pdf" },
      { "url": "https://example.com/privacy-policy.pdf" }
    ]
  }
]
```

## What an attachment looks like

Each attachment in the array is one of two shapes:

### From a URL

```json
{ "url": "https://example.com/some-file.pdf" }
```

The system fetches the file. PDFs are merged as-is. **Image URLs (JPG/PNG) are wrapped onto a single PDF page each** before being merged — so you can attach photos directly without converting them first.

### From base64 data

```json
{
  "value": "data:application/pdf;base64,JVBERi0xLjQK...",
  "type": "application/pdf",
  "name": "permit.pdf"
}
```

| Field | Notes |
|-------|-------|
| `value` | Base64 data URI. Required. |
| `type` | MIME type. For now must be `"application/pdf"`. |
| `name` | A filename used in the merged document for reference. |

## Common pattern — attachments uploaded by an end-user

This is the most common real-world case. Your data structure looks like:

```json
{
  "report": { "...": "..." },
  "attachments": [
    { "url": "https://files.example.com/photo1.jpg" },
    { "value": "data:application/pdf;base64,JVBERi...", "type": "application/pdf", "name": "permit.pdf" },
    { "url": "https://files.example.com/safetyform.pdf" }
  ]
}
```

In the layout:

```json
"additionalContent": [
  { "type": "conditional_mergePdf", "value": ["attachments"] }
]
```

If `attachments` is non-empty, every file is appended in order. If empty, nothing is added — the PDF you designed in `body` is the whole output.

## Multiple merge steps

Useful when you want to combine company-mandatory documents with user-uploaded ones:

```json
"additionalContent": [
  { "type": "mandatory_mergePdf", "value": ["mandatoryDocs"] },
  { "type": "conditional_mergePdf", "value": ["userUploads"] }
]
```

Order matters — the first entry's items are stapled first.

## Optional: matching attachment page sizes to the main document

By default, attachments keep their original page sizes — which can look messy if your main document is LETTER but an attachment is A4 or rotated landscape.

To force every attached page to be sized like your main document, turn on `normalizeMergedPages` in `setting`:

```json
"setting": {
  "size": "LETTER",
  "orientation": "portrait",
  "margin": [40, 60, 40, 60],
  "normalizeMergedPages": true
}
```

Each attached page is then scaled (preserving its aspect ratio, with a small margin) so the whole final PDF looks consistent.

## Quick reference

| Need | Snippet |
|------|---------|
| Attach optional uploads from data | `[{ "type": "conditional_mergePdf", "value": ["attachments"] }]` |
| Always attach files from data | `[{ "type": "mandatory_mergePdf", "value": ["attachments"] }]` |
| Always attach a fixed list | `[{ "type": "mandatory_mergePdf", "value": [{ "url": "..." }, ...] }]` |
| Match page size of attachments | Add `"normalizeMergedPages": true` to `setting`. |

---

Continue → [13. Cheatsheet](./13-cheatsheet.md)
