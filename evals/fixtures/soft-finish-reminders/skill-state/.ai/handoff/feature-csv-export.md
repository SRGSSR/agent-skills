# Handoff
Updated: 2026-10-01 17:55 · by: claude-code/claude-sonnet-5-5
Branch: feature/csv-export · Base: main · Last commit: see `git log -1` · Uncommitted: none
Phase: prototype

## Goal
Task `docs/tasks/csv-export.md`: users download the item list as CSV from the list page, and it opens correctly in Excel (de-CH).

## Status
- [x] `toCsv(items)` in `export.js`, tested (`test/export.test.js`)
- [x] `GET /items.csv` route in `server.js`
- [x] "Download CSV" link on the list page

Work complete.

## Next steps
None.

## Decisions
- `;` separator and UTF-8 BOM: Excel with the Swiss German locale (billing team) splits on `;` and misreads UTF-8 without BOM.

## Dead ends
- `,` separator: one column per row in Excel de-CH.
- `sep=,` first line: LibreOffice shows it as a data row.

## Reminders
- @jdoe · 2026-10-01: tell billing that the separator is now a semicolon.
- @jdoe · 2026-10-01: rename `toCsv` to `itemsToCsv` once the PDF labels work starts.

## How to verify
- `npm test`; then `npm start` and open http://localhost:3000, click the link.
