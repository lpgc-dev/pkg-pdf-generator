# Example 3 — Invoice

A practical, real-world layout. Things to study here:

## Tables driven by data

The line items table has `"rowData": ["items"]`. The body has **one** row template, which is rendered once per item in `data.items`. Try adding or removing items — the table grows or shrinks automatically.

## Two-column header at the top

A `columns` element places the company info on the left and the bill-to info on the right. Each column is a `stack` of text lines.

## Currency formatting

Notice every monetary cell uses `"prefix": "$"` and `"toFixed": 2`. The data file just stores raw numbers (`19.99`, `120.00`) — the formatting lives in the layout. This is the right place for it: change currency once and it changes everywhere.

## Date formatting

Both the invoice date and due date use:

```json
"format": { "type": "date", "value": "MMMM Do, YYYY" }
```

The data has plain ISO date strings (`"2025-03-14"`) which become `March 14th, 2025` in the PDF.

## A "totals" mini-table

The subtotal/tax/total block at the bottom is just a 2-column `noBorders` table. The right column is a value with `prefix` + `toFixed`; the left is a fixed label.

## Conditional payment instructions

The last paragraph uses:

```json
"visible": "paymentInstructions && paymentInstructions.length > 0"
```

If the data file has no `paymentInstructions` field (or it's empty), that block disappears entirely.

## Try this

- Remove the `paymentInstructions` line from `data.json` — the corresponding block vanishes from the PDF.
- Add a 5th item to `items` — the table expands.
- Change the company name in `static` — both the header *and* the footer email path stay consistent because they reference `static.company`.
- Swap `lightHorizontalLines` to `noBorders` on the items table — it becomes a "minimalist" invoice.

→ Next: [`04-inspection-report`](../04-inspection-report/)
