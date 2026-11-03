# Handoff
Updated: 2026-11-03 12:34 · by: claude-code/claude-opus-5-5
Branch: feature/on-off (git flow; `develop` created locally from `main`, not pushed) · Uncommitted: none after the eval-results commit

## Goal
Add per-project on/off to both skills (`/project-phase on|off`, `/work-journal on|off`) and check that triggers work in Italian, French and German. Done when evals pass and the user closes the feature.

## Status
- [x] On/off in both SKILL.md, README "Disable or uninstall", versions 0.2.0. Design: `docs/design/2026-11-03-on-off.md`
- [x] Evals 6-10 added (`evals/evals.json`, fixtures, `evals/grade.mjs`, `state-in-baseline` flag in `evals/fixtures/build.sh`)
- [x] Eval iteration 3: with skill 39/40, without 29/40. `workspace-review/iteration-3.html`
- [x] Reply language: both skills reply in the user's language; eval 8 rerun 6/6 with skill (`workspace-review/iteration-4.html`)

## Next steps
1. The user reviews, merges `feature/on-off` and pushes `develop` (never do it yourself).

## Decisions
- `off` leaves a `<!-- <skill>:off -->` marker; see the design note for why and the alternatives.
- Eval runs on Sonnet 5.5 subagents; baseline for on/off evals gets the same `.ai/` state.

## Dead ends
- Fixtures inside the project dir: `.git/` writes are denied by the sandbox. Build them in the scratchpad.
- `git flow init` needs to write `.git/config`: run it outside the sandbox.
- `/opt/homebrew/bin/python3.13` no longer exists; use `python3 -I`.

## Open questions
- None.

## How to verify
- `claude plugin validate .` (needs network, run outside the sandbox).
- `node --check evals/grade.mjs`; `bash evals/fixtures/build.sh <dir>` builds 7 fixtures.

## Pointers
- Journal: `.ai/journal/2026-11-03.md`
- Evals: `evals/evals.json`, `evals/grade.mjs`, `evals/run-prompt.md`
