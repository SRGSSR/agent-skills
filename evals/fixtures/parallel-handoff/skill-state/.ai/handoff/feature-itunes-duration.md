# Handoff
Updated: 2026-10-01 18:20 · by: codex/gpt-5
Branch: feature/itunes-duration · Last commit: "feat: add formatDuration helper" · Uncommitted: none
Phase: production

## Goal
Feed items include `<itunes:duration>` (HH:MM:SS) so Apple Podcasts shows episode length. Done when `npm test` passes, including new feed tests for items with and without a duration.

## Status
- [x] `formatDuration(seconds)` in `src/duration.js`, tested in `test/duration.test.js`
- [ ] Emit `<itunes:duration>` in `renderItem` (`src/feed.js`) when `episode.durationSeconds` is set
- [ ] Tests in `test/feed.test.js`: item with duration, item without duration

## Next steps
1. In `src/feed.js` `renderItem`, add `<itunes:duration>` with `formatDuration(episode.durationSeconds)` after `<enclosure>`, only when `durationSeconds` is a positive number.
2. Add the two tests to `test/feed.test.js`.
3. Run `npm test`; add a line under "Unreleased" in `CHANGELOG.md`.

## Decisions
- Omit the tag when the duration is unknown or 0, instead of emitting `00:00:00`: Apple flags zero durations (journal 2026-10-01 16:10).

## Dead ends
- `new Date(s * 1000).toISOString().substr(11, 8)`: wraps after 24h, and the archive has 25h live-stream episodes. Don't use it.
- `podcast` npm package to render the feed: cannot keep pinned episodes first. Stay with the hand-written template.

## Open questions
- None.

## How to verify
- `npm test`: currently all green (feed duration tests not written yet).

## Pointers
- Journal: `.ai/journal/2026-10-01.md`
- Key files: `src/feed.js`, `src/duration.js`, `test/feed.test.js`
