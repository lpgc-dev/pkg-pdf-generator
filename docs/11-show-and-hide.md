# 11. Show and hide

Sometimes a PDF needs to show different content based on the data — a row that only appears when a flag is set, a value that says "[YES]" instead of `true`, a section that's omitted entirely if a list is empty.

Two features handle this:

- [`visible`](#visible) — hide an element entirely based on a rule.
- [`condition`](#condition) — replace a value (or a whole sub-element) based on what the data says.

Both can be added to almost any element.

---

## `visible`

`visible` is a small expression that's checked against the data. If the expression is true, the element renders. If it's false, the element is silently dropped.

The expression looks like a simple JavaScript-like check. Example:

```json
{
  "type": "text",
  "value": "Premium customer perks apply.",
  "visible": "isPremium"
}
```

If the data has `"isPremium": true`, the text appears. If `"isPremium": false` (or missing), it's dropped.

### Available operators

You can use:

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` `===` | Equals | `"status === 'paid'"` |
| `!=` `!==` | Not equals | `"status !== 'cancelled'"` |
| `>` `<` `>=` `<=` | Compare | `"orderTotal > 0"` |
| `&&` | And | `"isPremium && hasDiscount"` |
| `\|\|` | Or | `"isVip \|\| isPremium"` |
| `!` | Not | `"!isCancelled"` |
| `.length` | Array/string length | `"items.length > 0"` |
| `.foo` | Object field | `"customer.country === 'US'"` |

### Useful patterns

**Hide a row when an array is empty**:
```json
{
  "type": "text",
  "value": "Attachments included with this report:",
  "visible": "attachments.length > 0"
}
```

**Show a warning only when a flag is true**:
```json
{
  "type": "text",
  "value": "OVERDUE — please follow up.",
  "style": "danger",
  "visible": "overdue"
}
```

**Combine multiple checks**:
```json
{
  "type": "text",
  "value": "VIP discount applied.",
  "visible": "isVip && discount > 0"
}
```

**Hide an entire table**:

You can put `visible` on a table itself:
```json
{
  "type": "table",
  "visible": "findings.length > 0",
  "rowData": ["findings"],
  "body": { ... }
}
```

If `findings` is empty, the whole table — header and all — is omitted.

### Note on safety

If the expression refers to a field that's missing from the data, it usually evaluates as `undefined`, which behaves like "false" for visibility purposes. So `visible: "warningCount > 5"` simply hides the element when `warningCount` doesn't exist. You don't need to defend against missing data.

---

## `condition`

`condition` is for when you need to **change the value** based on what the data says — turning `true` into `[YES]`, picking a different style for "approved" vs "rejected", or rendering a completely different element.

The structure is:

```json
"condition": {
  "type": [list, of, possible, raw, values],
  "<value>": { "value": "what to show" },
  "isNUll": { "value": "fallback if no match" }
}
```

`type` is the list of values you're matching against. For each value, you provide a key with the same name as the value, and inside it tell the package what to render.

### Booleans → friendly labels

```json
{
  "type": "text",
  "value": ["didSrManagerWearPPE"],
  "condition": {
    "type": [true, false],
    "true":  { "value": "[YES]" },
    "false": { "value": "[NO]" }
  }
}
```

| Data has | PDF shows |
|----------|-----------|
| `"didSrManagerWearPPE": true` | `[YES]` |
| `"didSrManagerWearPPE": false` | `[NO]` |

### String values

```json
{
  "type": "text",
  "value": ["status"],
  "condition": {
    "type": ["paid", "pending", "overdue"],
    "paid":    { "value": "✓ Paid",         "style": "success" },
    "pending": { "value": "Pending review",  "style": "small"   },
    "overdue": { "value": "OVERDUE",         "style": "danger"  }
  }
}
```

Notice the optional `"style"` inside each branch — when a condition matches, the element can switch styles too.

### Fallback with `isNUll`

`isNUll` is the fallback used when the data value doesn't match any branch (or the value is missing/empty):

```json
{
  "type": "text",
  "value": ["assigneeName"],
  "condition": {
    "type": [true, false],
    "true":  { "value": "[Assigned]" },
    "isNUll":{ "value": "Unassigned" }
  }
}
```

### Replacing a value with a whole table

Inside a condition branch, instead of `{ "value": "..." }`, you can drop in a full element — usually a small table:

```json
{
  "type": "text",
  "value": ["riskLevel"],
  "condition": {
    "type": ["high"],
    "high": {
      "type": "table",
      "widths": ["*"],
      "layout": "outside",
      "body": {
        "rows": [
          [ { "type": "text", "value": "HIGH RISK — escalate immediately.", "style": "danger" } ]
        ]
      }
    },
    "isNUll": { "value": "" }
  }
}
```

When `riskLevel` is `"high"`, the cell becomes a bordered red call-out table. Otherwise nothing is shown.

### Quick visual: how it picks

```
                  ┌── matches "true"  → use "true" branch
data value ──────►├── matches "false" → use "false" branch
                  └── no match        → use isNUll branch (or empty if not provided)
```

---

## When to use which

| Need | Tool |
|------|------|
| Hide an element entirely if a rule is false | `visible` |
| Show a different label for true / false / pass / fail / OK | `condition` |
| Show a different style when something is overdue | `condition` (with `style`) |
| Replace text with a richer element (e.g. a call-out box) | `condition` (with a sub-element) |
| Drop a section if a list is empty | `visible: "list.length > 0"` |

You can also combine them on the same element — `visible` decides whether to render at all, and `condition` decides what to render when it does.

---

Continue → [12. Merging external PDFs](./12-merging-pdfs.md)
