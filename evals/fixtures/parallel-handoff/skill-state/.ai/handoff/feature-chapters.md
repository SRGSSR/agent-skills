# Handoff
Updated: 2026-09-30 17:10 · by: claude-code/claude-sonnet-5-5
Branch: feature/chapters · Last commit: "wip: chapter parser" · Uncommitted: none
Phase: production

## Goal
Episodes with chapter markers get a `<podcast:chapters>` link in the feed. Done when the chapters JSON is served and linked for episodes that have chapters.

## Status
- [x] Parser for the chapter markers exported by the editing tool
- [ ] Serve `/chapters/<id>.json`
- [ ] Link it from `renderItem`

## Next steps
1. Waiting for the editorial team to confirm the chapter title format (see Open questions). Don't continue before that.

## Decisions
- Chapters JSON follows the Podcasting 2.0 spec, version 1.2.

## Dead ends
- None.

## Open questions
- For the editorial team: are chapter titles plain text or Markdown?

## How to verify
- `npm test` on `feature/chapters`.
