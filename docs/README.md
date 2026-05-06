# PDF Generator — Author's Guide

Welcome! This guide is for **the people who design what a PDF should look like** — not the people who write code.

If you can read and write JSON, you can build a PDF. You'll describe two things:

1. **A layout** — *what the document looks like* (titles, tables, signatures, where everything goes).
2. **The data** — *what fills the layout* (the actual names, dates, totals…).

The package takes both, glues them together, and produces a PDF.

---

## How to read this guide

The chapters are numbered. If you're brand new, read them in order: each one builds on the last. If you already know the basics, jump to whatever you need.

| # | Chapter | What's inside |
|---|---------|---------------|
| 1 | [Introduction](./01-introduction.md) | The mental model. Layout vs data. Your very first PDF. |
| 2 | [Layout structure](./02-layout-structure.md) | The 6 sections every layout has. The skeleton you'll always start from. |
| 3 | [Page settings](./03-page-settings.md) | Page size, orientation, margins, default font size. |
| 4 | [Styles](./04-styles.md) | Defining reusable styles (bold, color, alignment, etc.) — the "CSS" of the layout. |
| 5 | [Data and values](./05-data-and-values.md) | How a value picks up real data. Static values, JSON paths, prefixes/suffixes, date formatting, decimals. |
| 6 | [Text and visuals](./06-text-and-visuals.md) | The basic building blocks: `text`, `image`, `svg`, `qr`, `divider`. |
| 7 | [Tables](./07-tables.md) | The most powerful element. Static tables, dynamic tables driven by data, nested tables. |
| 8 | [Layout helpers](./08-layout-helpers.md) | `columns`, `stack`, `array` — for arranging things side-by-side or repeating sections. |
| 9 | [Signatures](./09-signatures.md) | The signature block: titles, columns per row, attendee labels. |
| 10 | [Headers and footers](./10-headers-and-footers.md) | Page header, page footer, page numbers, "show only on last page". |
| 11 | [Show and hide](./11-show-and-hide.md) | Conditionally showing or replacing values based on the data. |
| 12 | [Merging external PDFs](./12-merging-pdfs.md) | Stapling extra PDF attachments to the end of the generated document. |
| 13 | [Cheatsheet](./13-cheatsheet.md) | One-page quick reference for everything. |

## Working examples

These are full, runnable layout + data pairs. Each folder has a layout file, a sample data file, and a short README explaining what to look at. Start at the top:

| Folder | What it shows |
|--------|---------------|
| [`examples/01-hello-world`](./examples/01-hello-world/) | The bare minimum — a single line of text. |
| [`examples/02-greeting-card`](./examples/02-greeting-card/) | Static text, an image, and basic styling. |
| [`examples/03-invoice`](./examples/03-invoice/) | Dynamic tables driven by data, totals, columns. |
| [`examples/04-inspection-report`](./examples/04-inspection-report/) | Real-world: visibility rules, value switches, signatures, page numbers. |
| [`examples/05-attachments-merge`](./examples/05-attachments-merge/) | Generating a PDF and stapling other PDFs/images to the end. |

## A note on terminology

You'll see two words a lot:

- **Layout** — the JSON file that describes *the shape of the document*. Same shape every time.
- **Data** — the JSON file that fills in the blanks. Different every time.

The same layout + different data = different PDFs. That's the whole point.

## Where to ask for help

If something in the guide doesn't make sense, or you're trying to do something that isn't covered here, raise it with your developer counterpart and they can extend the docs (or the package).
