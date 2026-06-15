
# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.10] - 2026-06-15

Fix for nested-table layouts where the first data row was being re-rendered
as a repeating page header on multi-page tables, surfaced by the rigging
inspection PDF.

### Added

### Changed

- **`tableObject` `headerRows` default** — no longer hard-codes `1` when the
  layout omits `headerRows`. The default is now derived from `body.header`:
  `0` when there is no header, `1` for a single-row header, `N` for a
  multi-row header (`body.header[0]` is an array). An explicit
  `layout.headerRows` still wins.

### Fixed

- [PHO-1147](https://lgc-devops.atlassian.net/browse/PHO-1147)
  Rigging inspection PDF showed the first question/data row twice on
  multi-page tables. Root cause: `table.headerRows` was defaulting to `1`
  for tables that have no `body.header`, so pdfmake treated the first data
  row as the repeating header and re-rendered it after each page break.

## [1.0.9] - 2026-06-08

Iteration on the Shop Company OPS PO layout surfaced several improvements
to the generator core (style cascade, nested-table data threading,
multi-row table headers, page-break-aware table borders, header-rendering
quirks). Bundled here.

### Added

- **New named table layouts:**
  - `outsideWithRowLines` — same outer-only vertical borders as `outside`,
    plus a horizontal line at every row boundary. Use for long
    rowData-driven tables so they close cleanly at every page break (the
    bottom of the last visible row on each page has a border, and the
    first row on the continuation page has its top line).
  - `outsideWithSoftRowLines` — same as `outsideWithRowLines` but the
    inter-row hLines are drawn in `#f0f0f0` so they read as a hairline
    whisper rather than a hard grid. Outer top/bottom/sides stay solid
    black.
  - `outsidePerPage` — stateful factory layout. Outer borders identical
    to `outside`, plus a horizontal line *only* at page-break boundaries
    (no inter-row lines on the same page). Detection works by counting
    `hLineWidth` invocations per index — pdfmake fires the 4th call when
    the `dontBreakRows` pageChanged callback runs for a row that's about
    to flow to a new page. Requires `dontBreakRows: true` on the
    consuming table. Pair with the closing-line patch below to also draw
    the bottom border on the previous page.
- **Multi-row `body.header`** — `body.header` can now be either the
  legacy single-row form (`[cell, cell, ...]`) or a multi-row spec
  (`[[cell, ...], [cell, ...]]`). Pair with `headerRows: N` to control
  how many rows pdfmake treats as the repeating header. Enables
  "section label below column headers" patterns where both rows follow
  the table across page breaks.
- **`header.skipLastPage: true`** option on the layout config. When set,
  the generator wraps the document header in a per-page function that
  returns `undefined` on the final page — useful when the last page only
  holds totals / notes / signatures and the per-page company header
  would crowd it. Default behavior (omitted or `false`) is unchanged.
- **Runtime monkey-patch on `TableProcessor.prototype.endRow`** that
  draws a closing horizontal line at the bottom of the *previous* page
  when a `dontBreakRows: true` table flows across a page break.
  pdfmake's built-in `pageChanged` callback only draws the top line on
  the new page. The patch captures `writer.context().y` and the page
  index *before* `commitUnbreakableBlock` runs, then after the original
  callback fires, additionally calls `drawHorizontalLine` with the
  captured y and `forcePage` to emit the closing line on the old page.
  Opt-in via a `drawClosingLineOnPageBreak: true` flag on the layout
  config — `outsidePerPage` sets this automatically. Other layouts are
  unaffected.

### Changed

- **Style-level `alignment` now cascades.** Text items no longer force
  `alignment: "left"` on every cell, which previously silently overrode
  the alignment declared on the resolved style. Item-level `alignment`
  is emitted only when the layout explicitly sets one. Affects both
  `processStackContent` and `processTextContent`.
- **Nested `table` items inside a `stack`** now receive the full data
  root via a `jsonData` fallback: `tableObject(item, data ?? jsonData,
  staticData)`. Without this, value paths like `["someKey"]` inside a
  nested table rendered the literal key as text instead of resolving.
- **`getTableLayout`** invokes a `TABLE_LAYOUTS` entry if it's a
  function, so stateful factory layouts (like `outsidePerPage`) get
  fresh state per table render.
- **Document header rendering** no longer wraps a single
  `header.contents` item in a `columns` layout. Single-item headers
  render the item directly. The `columns` wrapper was introducing
  unexpected border/styling artifacts on nested tables in some viewers.
  Multi-item headers still use `columns` so siblings render
  side-by-side.

### Fixed

- **`processTextContent`** coerces a null/undefined resolved value to
  an empty string. Previously a cell with no `value` (e.g. a colSpan-
  placeholder cell carrying only `colSpan` and no `text`) was produced
  as `{ text: undefined, style, colSpan }`. JSON serialization drops
  `undefined`, so pdfmake received `{ style, colSpan }` and aborted the
  document with "Unrecognized document structure". With the coercion,
  empty placeholder cells now serialize as
  `{ text: "", style, colSpan }` which pdfmake accepts as an empty cell.

## [1.0.1] - 2025-02-10

Updated package.json with the newer version track the node_modules easily

### Added

### Changed

### Fixed

- [PHO-997](https://lgc-devops.atlassian.net/browse/PHO-997)
  Add versioning for the pkg-pdf-generator library to track which version is running currently on deployed web

## [1.0.2] - 2025-02-10

Updated way how it was creating divider from table to the canvas to keep consistency

### Added

### Changed

### Fixed

- [PHO-997](https://lgc-devops.atlassian.net/browse/PHO-997)
  It adds extra space when adding divider in prod build, fixed by updating function

## [1.0.3] - 2025-02-10

Updated way how it was creating divider from table to the canvas to keep consistency

### Added

### Changed

### Fixed

- [PHO-996](https://lgc-devops.atlassian.net/browse/PHO-996)
  Updated logic to consider the jsonData if data is empty
