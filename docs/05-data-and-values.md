# 5. Data and values

This is the most important chapter. Once you understand how a value picks up data, you understand 80% of how layouts work.

## The three kinds of values

Whenever a layout has a `"value"` property, that value can be one of three things:

| Form | Meaning |
|------|---------|
| `"value": "Hello"` | A literal string. The PDF shows the word `Hello`. |
| `"value": ["userName"]` | A path into the **data file**. Look up `userName` from the data. |
| `"value": ["$", "logo"]` | A path into the layout's `static` section. Look up `logo` from the layout itself. |

Same idea applies to numbers, booleans, anything. The string `"Hello"` is shown as-is. The array `["userName"]` is interpreted as "look this up".

## Looking things up in the data

Say your data file looks like this:

```json
{
  "customer": {
    "firstName": "Alex",
    "lastName": "Doe"
  },
  "orderTotal": 47.50
}
```

To put the first name into the PDF:

```json
{ "type": "text", "value": ["customer", "firstName"] }
```

Each item in the array is one step deeper into the JSON.

| Layout writes | Data resolves to |
|---------------|------------------|
| `["customer"]` | `{ "firstName": "Alex", "lastName": "Doe" }` (the whole object — usually used for nested tables, see chapter 7) |
| `["customer", "firstName"]` | `"Alex"` |
| `["orderTotal"]` | `47.50` |

If a path doesn't exist in the data, the value comes out as an empty string `""`. The PDF will simply have nothing in that spot — it won't crash.

## Looking things up in `static`

The `static` section of the layout works the same way, but you start the path with `"$"`:

```json
"static": {
  "company": {
    "name": "ACME Corp",
    "logo": "data:image/png;base64,iVBORw0K..."
  }
}
```

Then:

```json
{ "type": "text",  "value": ["$", "company", "name"] }
{ "type": "image", "value": ["$", "company", "logo"], "width": 100 }
```

`["$", ...]` always means "find this in the layout's static". Anything else means "find this in the data".

## Why have both?

Use `static` for things that **never change** between PDFs of this type — your company logo, the boilerplate copyright line, fixed icons. They're part of the design.

Use the data file for things that **do change** — the customer name, the date, the order number, the photos. They're the content.

## Adding a prefix or a suffix

Sometimes you want to wrap a value with extra text that the data doesn't include. Two properties handle this: `prefix` (text before) and `suffix` (text after).

```json
{
  "type": "text",
  "value": ["orderTotal"],
  "prefix": "$",
  "suffix": " USD"
}
```

If `orderTotal` is `47.50`, the PDF shows `$47.50 USD`.

You can use a separator between prefix/suffix and the value with `afterPrefix` and `beforeSuffix`:

```json
{
  "type": "text",
  "value": ["customerName"],
  "prefix": "Bill to",
  "afterPrefix": ": "
}
```

If `customerName` is `Alex Doe`, this shows `Bill to: Alex Doe`.

You can also pull the prefix/suffix from the data, by writing it as a path:

```json
{
  "type": "text",
  "value": ["productName"],
  "prefix": ["currencySymbol"]
}
```

## Formatting a date

If your data has a date stored as a string like `"2025-03-14T10:00:00.000Z"`, you usually don't want the PDF to show that exact text. Add a `format` block:

```json
{
  "type": "text",
  "value": ["createdAt"],
  "format": { "type": "date", "value": "MM/DD/YYYY" }
}
```

Result: `03/14/2025`.

The `value` in the format block uses [day.js format tokens](https://day.js.org/docs/en/display/format). Common ones:

| Token | Means | Example |
|-------|-------|---------|
| `YYYY` | 4-digit year | 2025 |
| `MM` | 2-digit month | 03 |
| `DD` | 2-digit day | 14 |
| `MMM` | Short month name | Mar |
| `MMMM` | Full month name | March |
| `Do` | Day with ordinal | 14th |
| `HH` | 24-hour hour | 14 |
| `mm` | Minute | 05 |
| `ss` | Second | 09 |
| `A` | AM / PM | PM |

Examples:

| Format | Output |
|--------|--------|
| `"MM/DD/YYYY"` | `03/14/2025` |
| `"DD-MMM-YYYY"` | `14-Mar-2025` |
| `"MMMM Do, YYYY"` | `March 14th, 2025` |
| `"YYYY-MM-DD HH:mm"` | `2025-03-14 14:05` |
| `"h:mm A"` | `2:05 PM` |

If the value is null/empty, you get an empty string (not "Invalid Date").

## Rounding numbers to a fixed number of decimals

If your data has long decimals like `47.49999998`, use `toFixed`:

```json
{
  "type": "text",
  "value": ["price"],
  "toFixed": 2,
  "prefix": "$"
}
```

Output: `$47.50`.

`toFixed: 2` rounds to 2 decimal places. `toFixed: 0` rounds to a whole number. Combine with `prefix` and `suffix` to get currency or units.

## Order things happen in

When a single text element has many of these features, they apply in this order:

1. The value is resolved from data (or static).
2. `toFixed` rounds the number.
3. `format` formats it as a date.
4. `prefix` is prepended.
5. `suffix` is appended.
6. `condition` (chapter 11) can replace it entirely if a condition matches.

Knowing the order is useful when something looks "almost right". For example, if you want `$ 1,234.50`, the prefix `$` is applied **after** rounding — so toFixed sees `1234.5` and rounds it, then prefix runs.

## Quick recap

| What you want | What to write |
|---------------|---------------|
| A literal piece of text | `"value": "Some text"` |
| A value from the data | `"value": ["path", "to", "value"]` |
| A value from `static` | `"value": ["$", "path", "to", "value"]` |
| Currency-style | `"value": ["price"], "toFixed": 2, "prefix": "$"` |
| Formatted date | `"value": ["date"], "format": { "type": "date", "value": "MM/DD/YYYY" }` |
| Wrap a value with text | `"value": ["name"], "prefix": "Hello, ", "suffix": "!"` |

---

Continue → [6. Text and visuals](./06-text-and-visuals.md)
