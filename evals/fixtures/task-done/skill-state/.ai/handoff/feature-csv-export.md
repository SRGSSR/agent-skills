# Handoff
Updated: 2026-10-01 16:40 · by: claude-code/claude-sonnet-5-5
Branch: feature/csv-export · Last commit: see `git log -1` · Uncommitted: none
Phase: prototype

## Goal
Task `docs/tasks/csv-export.md`: users download the item list as CSV from the list page, and it opens correctly in Excel (de-CH).

## Status
- [x] `toCsv(items)` in `export.js`, tested (`test/export.test.js`)
- [ ] `GET /items.csv` route in `server.js`
- [ ] Download link on the list page

## Next steps
1. In `server.js`, add `GET /items.csv`: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="items.csv"`, body `toCsv(items)`.
2. Add a "Download CSV" link to `renderList()` above the list.
3. Run `npm test`.

## Decisions
- `;` separator and UTF-8 BOM: Excel with the Swiss German locale (billing team) splits on `;` and misreads UTF-8 without BOM. Tried in Excel de-CH and LibreOffice.

## Dead ends
- `,` separator: one column per row in Excel de-CH.
- `sep=,` first line: LibreOffice shows it as a data row.

## Open questions
- For the user: should archived items be included? Items have no archived flag yet, so this needs a decision first.

## How to verify
- `npm test`; then `npm start` and open http://localhost:3000, click the link.
