# Example 2 — Greeting card

A short, single-page document. Demonstrates:

- Defining named styles (`title`, `tagline`, `body`, `signoff`).
- Using `static` to hold a reusable SVG logo and a tagline.
- An `svg` element rendering the logo.
- A `divider` between sections.
- A footer that uses `static` data and a `showDivider` line.

## Things to notice

- **Both the body and the footer reference the same tagline** with `["$", "tagline"]`. Defining once in `static` keeps the document consistent and easy to update.
- The body uses `\n` characters in `data.json` to break the paragraph in the right place — most layouts won't need this, but you can still control basic line breaks from your data.
- Margins inside `styles` (e.g. `"margin": [0, 20, 0, 0]`) handle the whitespace between blocks. No need to add empty elements.

## Try this

- Change the tagline in `static` — both the heading and the footer update at once.
- Replace the SVG with your own logo (any SVG markup works).
- Swap the page size in `setting` to `"A5"` for a smaller card-sized output.

→ Next: [`03-invoice`](../03-invoice/)
