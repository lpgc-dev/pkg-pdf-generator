# 1. Introduction

## The mental model

Imagine you're designing a form letter. You write the letter once with blanks like `Dear ____,` and then fill the blanks in for each recipient. The result is hundreds of personalised letters.

This package works the same way:

- The **layout** is the form letter — it has the design and the blanks.
- The **data** is what fills the blanks.

Two JSON files. One PDF.

```text
   layout.json (design)        data.json (content)
          \                       /
           \                     /
            \                   /
             >> PDF Generator <<
                     |
                     v
                 result.pdf
```

## Two kinds of values inside a layout

When the layout says "put a value here", it can mean one of two things:

1. **A literal value** — written directly in the layout. The PDF always shows the exact same text.
2. **A reference to data** — written as a JSON path. The PDF shows whatever the data file says at that path.

You'll see lots of examples of both shortly. The short version:

| Layout writes… | Meaning |
|----------------|---------|
| `"value": "Hello"` | Show the word **Hello**. Always. |
| `"value": ["userName"]` | Look in the data for `userName` and show that. |
| `"value": ["$", "logoUrl"]` | Look in the layout's own `static` section for `logoUrl` and show that. |

The leading `"$"` means "look in the layout itself", everything else means "look in the data file".

## Your first PDF

Here is the smallest layout that produces a PDF:

```json
{
  "static": {},
  "styles": {},
  "setting": {
    "size": "LETTER",
    "orientation": "portrait",
    "margin": [40, 40, 40, 40]
  },
  "header": { "margin": [0, 0, 0, 0], "contents": [] },
  "footer": { "margin": [0, 0, 0, 0], "contents": [] },
  "body": {
    "content": [
      {
        "type": "text",
        "value": "Hello, world!",
        "alignment": "center"
      }
    ]
  }
}
```

A matching data file (it can even be empty here, since nothing is referenced):

```json
{}
```

Result: a one-page LETTER-size PDF that says **Hello, world!** centred horizontally near the top.

That's it. Everything else in this guide is just adding more elements to the `body.content` array, defining nicer styles, or pulling values from the data file.

## What you'll learn next

The very next chapter walks through every part of the layout file in order. After that, each chapter focuses on one feature at a time. Each example you read here will work as-is — you can paste it into a layout file, make a small data file to match, and generate a PDF immediately.

Continue → [2. Layout structure](./02-layout-structure.md)
