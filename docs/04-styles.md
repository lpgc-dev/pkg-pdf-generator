# 4. Styles

Styles are how you make text look the way you want — bold, coloured, larger, centred. You **define styles by name** in the `styles` section, and then **refer to them by name** wherever a text element needs styling.

This is exactly like CSS classes if you've seen those: define once, use many times.

## Defining a style

A style is a name plus a set of properties:

```json
"styles": {
  "title": {
    "fontSize": 22,
    "bold": true,
    "color": "#222222",
    "margin": [0, 0, 0, 10]
  }
}
```

You can define as many as you like. A typical layout has 5–15 styles.

## Using a style

Anywhere you write a text element, set `"style"` to the name:

```json
{ "type": "text", "value": "Daily Report", "style": "title" }
```

If you don't set a `"style"`, the element uses the layout's default body font.

## Full list of style properties

| Property | Type | What it does | Example |
|----------|------|--------------|---------|
| `fontSize` | number | Font size in points. | `"fontSize": 14` |
| `bold` | true / false | Bold the text. | `"bold": true` |
| `italics` | true / false | Italicise the text. | `"italics": true` |
| `alignment` | string | Horizontal alignment. One of `"left"`, `"center"`, `"right"`, `"justify"`. | `"alignment": "center"` |
| `color` | string | Text colour. Named (`"red"`) or hex (`"#cc0000"`). | `"color": "#0a7d3a"` |
| `background` | string | Background colour behind the text. | `"background": "#fff5cc"` |
| `fillColor` | string | Cell fill colour (when used inside a table cell). | `"fillColor": "#9c9c9c"` |
| `lineHeight` | number | Spacing between lines (1 = single, 1.5 = wider). | `"lineHeight": 1.4` |
| `characterSpacing` | number | Letter-spacing in points. | `"characterSpacing": 0.5` |
| `decoration` | string | `"underline"`, `"lineThrough"`, or `"overline"`. | `"decoration": "underline"` |
| `decorationStyle` | string | `"dashed"`, `"dotted"`, `"double"`, or `"wavy"`. | `"decorationStyle": "dashed"` |
| `decorationColor` | string | Colour of the decoration line. | `"decorationColor": "#0066cc"` |
| `markerColor` | string | Bullet colour (for bulleted lists). | `"markerColor": "#999999"` |
| `noWrap` | true / false | Force the text onto a single line. | `"noWrap": true` |
| `margin` | array of 4 numbers | `[left, top, right, bottom]` whitespace around the element. | `"margin": [0, 5, 0, 5]` |
| `font` | string | Font family. Defaults to the bundled Roboto. | `"font": "Roboto"` |
| `fontFeatures` | array of strings | Advanced typographic features (rare). | `"fontFeatures": ["smcp"]` |

## Colours

You can specify any colour two ways:

- **By name**: `"red"`, `"blue"`, `"green"`, `"black"`, `"white"`, `"yellow"`, `"orange"`, `"gray"`, `"lightgray"`, `"darkgray"`, etc.
- **By hex code**: `"#ff0000"`, `"#0066cc"`, `"#fafafa"`. Hex is preferred for design systems because you can match brand colours exactly.

## Margins inside styles

Margins inside a style follow the same `[left, top, right, bottom]` rule as page margins. Putting margin into a style is convenient because every element using that style will share the same spacing.

```json
"styles": {
  "section": { "fontSize": 14, "bold": true, "margin": [0, 15, 0, 5] }
}
```

Now every `"style": "section"` heading has 15pt of space above and 5pt below.

## A useful set of starter styles

This is a sensible starting point that covers most documents. Customise the colours/sizes to taste:

```json
"styles": {
  "title":      { "fontSize": 22, "bold": true, "color": "#222222", "margin": [0, 0, 0, 12] },
  "subtitle":   { "fontSize": 14, "bold": true, "color": "#444444", "margin": [0, 10, 0, 4] },
  "label":      { "fontSize": 10, "color": "#666666", "bold": true },
  "value":      { "fontSize": 11, "color": "#111111" },
  "small":      { "fontSize": 9,  "color": "#666666" },
  "tableHead":  { "bold": true, "fontSize": 11, "color": "white", "fillColor": "#3b5bdb", "alignment": "center" },
  "tableCell":  { "fontSize": 10 },
  "danger":     { "color": "white", "fillColor": "#cc0000", "bold": true, "alignment": "center" },
  "success":    { "color": "white", "fillColor": "#0a7d3a", "bold": true, "alignment": "center" }
}
```

## Overriding a style on one element

Sometimes you want a one-off tweak. Any style property can be set **directly on the element**, and it overrides the named style for that one element:

```json
{
  "type": "text",
  "value": "Special note",
  "style": "value",
  "color": "#cc0000",
  "italics": true
}
```

This uses the `value` style, but with red italic text just for this one element.

## A note about the magic style `normalText`

The package quietly defines a style called `normalText`. It's the fallback used when text has no other style. You can override it by defining your own `normalText` in `styles` if you want to change defaults globally:

```json
"styles": {
  "normalText": { "fontSize": 11, "color": "#333333" }
}
```

---

Continue → [5. Data and values](./05-data-and-values.md)
