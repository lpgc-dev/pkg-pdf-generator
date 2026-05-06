# Example 4 — Inspection report

A real-world layout that brings together most of the package's features. Read through the layout once, then come back here for what to look at.

## Things to study

### 1. Boolean → "[YES]" / "[NO]" with styles

In the metadata table, the `ppeCompliant` and `siteSecured` cells use a `condition` block with branches for `true` and `false`. Each branch picks both a label and a style — so `true` shows a green pill, `false` shows a red pill.

```json
"condition": {
  "type": [true, false],
  "true":  { "value": "[YES]", "style": "yes" },
  "false": { "value": "[NO]",  "style": "no"  }
}
```

### 2. A warning box that only appears when a flag is true

```json
{
  "type": "text",
  "value": "URGENT: site was not secured at time of inspection.",
  "style": "warningBox",
  "visible": "siteSecured === false"
}
```

If you flip `"siteSecured"` to `true` in the data, the red banner disappears entirely.

### 3. Severity → multiple values, with one of them styled

The findings table maps `low`/`medium`/`high` to readable labels. `high` gets the red pill style, the rest stay neutral.

### 4. Auto-skipping empty rows

The findings array has a deliberately empty 4th item (`{ "id": "", "description": "", ... }`) to show this:

```json
"ignoreEmpty": { "enable": true, "value": ["description"] }
```

Because the `description` field is empty, that row is dropped automatically. Try removing the `ignoreEmpty` block — the empty row reappears.

### 5. Hide an entire section when a list is empty

The "Recommended actions" heading and table both have `"visible": "actions.length > 0"`. If your data has no actions, neither the heading nor the table renders — no awkward empty space, no orphan heading.

### 6. Page numbering and a divider in the footer

Long inspection reports can spill onto multiple pages. The footer has `"showPageNumber": true` and `"showDivider": true` for a clean, professional look.

### 7. Signature grid with role labels

The signature block has `"attendeeType": true`, so each signer's role (Inspector / Site lead / Witness) appears as a small rotated label on the left of their signature box. `"maxItemsPerRow": 3` packs three signatures per row.

## Try this

- Set `"siteSecured": true` — the red banner disappears.
- Set `"actions": []` — the whole "Recommended actions" section vanishes.
- Add a 4th, 5th, 6th signer to `signers` — they wrap onto a second row of three boxes.
- Change the layout from `"lightHorizontalLines"` to `null` (full borders) on the findings table — the look changes immediately.

→ Next: [`05-attachments-merge`](../05-attachments-merge/)
