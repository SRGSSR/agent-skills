# Handoff
Updated: 2026-10-01 16:40 · by: claude-code/claude-sonnet-5-5
Branch: feature/csv-helper · Base: develop · Last commit: see `git log -1` · Uncommitted: none
Phase: prototype

## Goal
Task `docs/tasks/csv-helper.md`: `toCsv(items)` returns a CSV that opens correctly in Excel (de-CH), tested and documented.

## Status
- [x] `toCsv(items)` in `export.js`
- [x] Tests in `test/export.test.js`
- [x] `docs/csv-export.md` (separator, BOM, discarded options)

## Next steps
None: ready to finish.

## Decisions
- `;` separator and UTF-8 BOM, recorded in `docs/csv-export.md`.

## Dead ends
- `,` separator and `sep=,`: recorded in `docs/csv-export.md`.

## Open questions
None.

## How to verify
- `npm test`
