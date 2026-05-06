# 9. Signatures

A signature element renders a grid of signature boxes, each with the signer's name and (optionally) a label of their role. It's purpose-built for forms where multiple people sign — inspections, attendance sheets, sign-off documents.

## Minimum example

```json
{
  "type": "signature",
  "rowData": ["attendees"],
  "signature": ["signatureData"],
  "displayNames": ["attendeeName"],
  "title": "Signatures",
  "placeholder": "No signatures captured."
}
```

What this needs from your data:

```json
{
  "attendees": [
    { "attendeeName": "Alex Doe",   "signatureData": "data:image/svg+xml;base64,..." },
    { "attendeeName": "Sam Singh",  "signatureData": "data:image/svg+xml;base64,..." }
  ]
}
```

The result: a "Signatures" heading, then 2 signature cards in a row, each with the SVG signature on top and the name centred underneath.

## All the options

| Property | Default | What it does |
|----------|---------|--------------|
| `type` | required | Always `"signature"`. |
| `rowData` | required | Path into the data — the array of people. Can also be a single object (it gets wrapped in an array of 1). |
| `signature` | required | Path **inside each person's data** to that person's signature SVG. |
| `displayNames` | required | Path inside each person's data to the display name. Can also be an object — see "Decorating display names" below. |
| `title` | `"Signatures"` | Heading shown above the grid. |
| `showTitle` | `true` | Set to `false` to hide the heading. |
| `titleFontSize` | `12` | Font size of the heading. |
| `titleMargin` | `[0, 5, 0, 5]` | `[left, top, right, bottom]` around the heading. |
| `showTitleDivider` | `false` | When `true`, draws a thin line under the title. |
| `placeholder` | `"No signatures available"` | Text shown when the array is empty. |
| `maxItemsPerRow` | `2` | Maximum signature boxes per row. |
| `minItemsPerRow` | same as `maxItemsPerRow` | Minimum boxes per row — pads the last row with blank slots so columns stay aligned. |
| `boxGap` | `3` | Gap between boxes (in points). |
| `attendeeType` | `false` | When `true`, renders a small rotated label on the left of each box (see below). |

## Box layout — one row of 4

```json
{
  "type": "signature",
  "rowData": ["attendees"],
  "signature": ["signatureData"],
  "displayNames": ["attendeeName"],
  "maxItemsPerRow": 4,
  "minItemsPerRow": 4
}
```

If you have 7 attendees, you get 2 rows: 4 in the first row, 3 plus a blank slot in the second. Setting `minItemsPerRow` equal to `maxItemsPerRow` keeps all signature boxes the same width regardless of how many people signed.

## Showing each person's role

If your attendees have different roles (e.g. "Supervisor", "Worker", "Visitor"), use `attendeeType`:

```json
{
  "type": "signature",
  "rowData": ["attendees"],
  "signature": ["signatureData"],
  "displayNames": ["attendeeName"],
  "attendeeType": true
}
```

For this to do anything, **each item in your data array must have an `attendeeType` field**:

```json
{
  "attendees": [
    { "attendeeName": "Alex Doe",  "attendeeType": "Supervisor", "signatureData": "..." },
    { "attendeeName": "Sam Singh", "attendeeType": "Worker",     "signatureData": "..." }
  ]
}
```

The role appears as a small vertical (rotated) label running up the left side of each signature box.

## Decorating display names

The simplest form of `displayNames` is just a path:

```json
"displayNames": ["attendeeName"]
```

You can also pass an object to add a fixed prefix or pull a prefix from each person's data:

```json
"displayNames": {
  "path": ["attendeeName"],
  "prefix": "Inspector: ",
  "suffix": ""
}
```

Or pull the prefix dynamically:

```json
"displayNames": {
  "path": ["attendeeName"],
  "prefix": ["title"]
}
```

That second form looks for a `title` field on each person and uses it as their prefix — so each name can have its own decoration like `"Mr. Alex Doe"` or `"Dr. Sam Singh"`.

## When the array is empty

Set `placeholder` to something useful:

```json
{
  "type": "signature",
  "rowData": ["attendees"],
  "signature": ["signatureData"],
  "displayNames": ["attendeeName"],
  "placeholder": "No attendees signed in for this inspection."
}
```

If the data has no attendees (or an empty array), the title shows and the placeholder text appears below it.

## What does the signature data look like?

The `signature` path should resolve to either:

- A raw SVG string starting with `<svg ...>`, or
- A base64-encoded SVG data URI starting with `data:image/svg+xml;base64,...`.

The package decodes the base64 form automatically. If the signature isn't a valid SVG, an "Invalid SVG" placeholder image appears in its place — so the rest of the document still renders.

## Putting it together — a full signature block

```json
{
  "type": "signature",
  "title": "Witnessed and signed by",
  "showTitleDivider": true,
  "titleFontSize": 14,
  "titleMargin": [0, 16, 0, 6],
  "rowData": ["signers"],
  "signature": ["signatureSvg"],
  "displayNames": {
    "path": ["fullName"],
    "prefix": ["title"]
  },
  "attendeeType": true,
  "maxItemsPerRow": 3,
  "minItemsPerRow": 3,
  "boxGap": 4,
  "placeholder": "No signatures yet."
}
```

Matching data:

```json
{
  "signers": [
    {
      "fullName": "Alex Doe",
      "title": "Mr. ",
      "attendeeType": "Inspector",
      "signatureSvg": "data:image/svg+xml;base64,..."
    },
    {
      "fullName": "Sam Singh",
      "title": "Dr. ",
      "attendeeType": "Witness",
      "signatureSvg": "data:image/svg+xml;base64,..."
    }
  ]
}
```

This produces a heading "Witnessed and signed by" with a thin line under it, followed by two signature cards (each with a rotated role label on the left, the signature, and the prefixed name underneath).

---

Continue → [10. Headers and footers](./10-headers-and-footers.md)
