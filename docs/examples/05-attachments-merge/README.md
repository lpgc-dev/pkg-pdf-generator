# Example 5 — Cover sheet + merged attachments

This is a "cover sheet + appendix" pattern. The package generates the cover sheet from the layout, then **staples the listed attachments to the end** of the same PDF.

## What's happening

The body is just the cover sheet — title, metadata table, and a list of attached documents.

The magic is at the end of the layout:

```json
"additionalContent": [
  { "type": "conditional_mergePdf", "value": ["attachments"] }
]
```

This says: take the array at `data.attachments` and append each item's content to the PDF.

Each attachment item in the data has a `url` field, so the package fetches the file. PDFs are appended page-for-page; images (JPG/PNG) are wrapped onto a single PDF page each.

## Things to study

### 1. Two roles for the `attachments` array

Notice the same array is used twice:
- The **cover sheet table** lists the attachments by index/name/kind, by iterating `["attachments"]` with `rowData`.
- The **merge step** at the end uses the same array, with `conditional_mergePdf`, to actually staple the files in.

So one array drives both the listing and the merging.

### 2. `normalizeMergedPages` keeps everything looking consistent

```json
"setting": {
  "size": "LETTER",
  "normalizeMergedPages": true
}
```

When this is on, every attached page is scaled to fit your LETTER size. Without it, an A4 attachment would end up sized like A4 in the middle of LETTER pages — visually jarring. Try turning it off and back on with attachments of mixed sizes.

### 3. Conditional vs mandatory merging

Right now the layout uses `conditional_mergePdf` — if `attachments` is empty, the package simply doesn't merge anything. The cover sheet's "no attachments" message takes care of that case.

Switch the type to `mandatory_mergePdf` if you always want to merge (e.g. if you also have a fixed boilerplate document to staple in).

### 4. Mixing literal and dynamic attachments

You can have multiple merge steps. For example, always staple a "terms and conditions" PDF first, then the user-uploaded attachments:

```json
"additionalContent": [
  {
    "type": "mandatory_mergePdf",
    "value": [
      { "url": "https://example.com/terms-and-conditions.pdf" }
    ]
  },
  {
    "type": "conditional_mergePdf",
    "value": ["attachments"]
  }
]
```

## Try this

- Replace the URLs with real ones you control. Anyone running this with the example URLs will fail — those are placeholders for documentation.
- Set `attachments` to `[]` — the cover sheet renders alone, with the "no supporting documents" message visible.
- Add a base64 attachment instead of a URL: `{ "value": "data:application/pdf;base64,...", "type": "application/pdf", "name": "embedded.pdf" }`.

## And that's it

You've now seen every major feature of the package. From here, the [cheatsheet](../../13-cheatsheet.md) is your friend — it's a one-page lookup for everything.
