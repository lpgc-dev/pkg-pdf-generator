# Example 1 — Hello world

The simplest possible PDF that demonstrates **the core idea**:

- A literal string in the layout (`"Hello, world!"`).
- A value pulled from the data (`["greeting"]`).
- A reusable named style (`"title"`).

## What to look at

Open `layout.json`. There are two text elements in the body:

1. The first has `"value": "Hello, world!"` — that's a literal. The PDF will always say exactly that.
2. The second has `"value": ["greeting"]` — that's a path. It tells the package "look in the data file for `greeting` and put that here".

Now open `data.json`. The `greeting` field is `"This document was generated from JSON."` — that's what shows up in the PDF.

## Try this

Change `"greeting"` in `data.json` and regenerate the PDF. The first line stays the same; the second line changes.

That's the whole package, in miniature.

## Reading order

Once you understand this, the next example introduces images and styles, and from there it builds up.

→ Next: [`02-greeting-card`](../02-greeting-card/)
