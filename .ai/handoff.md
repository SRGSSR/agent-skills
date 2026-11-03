# Handoff
Updated: 2026-11-03 12:35 · by: claude-code/claude-opus-5-5
Branch: feature/on-off (git flow; `develop` created locally from `main`, not pushed) · Uncommitted: none after the eval-results commit

## Goal
Add per-project on/off to both skills (`/project-phase on|off`, `/work-journal on|off`) and check that triggers work in Italian, French and German. Done when evals pass and the user closes the feature.

## Status
- [x] On/off in both SKILL.md, README "Disable or uninstall", versions 0.2.0. Design: `docs/design/2026-11-03-on-off.md`
- [x] Evals 6-10 added (`evals/evals.json`, fixtures, `evals/grade.mjs`, `state-in-baseline` flag in `evals/fixtures/build.sh`)
- [x] Eval iteration 3: with skill 39/40, without 29/40. `workspace-review/iteration-3.html`
- [ ] Language: with the skill, eval 8 replied in English to an Italian request (fix proposed, awaiting the user)

## Next steps
1. If the user agrees: add "reply in the user's language; keep AGENTS.md blocks and `.ai/` files in English" to both SKILL.md (On / off and setup reports), rerun eval 8 only (`evals/run-prompt.md`, `<scratchpad>/prep-iteration.sh`-style layout).
2. The user merges `feature/on-off` and pushes `develop` (never do it yourself).

## Decisions
- `off` leaves a `<!-- <skill>:off -->` marker; see the design note for why and the alternatives.
- Eval runs on Sonnet 5.5 subagents; baseline for on/off evals gets the same `.ai/` state.

## Dead ends
- Fixtures inside the project dir: `.git/` writes are denied by the sandbox. Build them in the scratchpad.
- `git flow init` needs to write `.git/config`: run it outside the sandbox.
- `/opt/homebrew/bin/python3.13` no longer exists; use `python3 -I`.

## Open questions
- For the user: apply the language fix and rerun eval 8?

## How to verify
- `claude plugin validate .` (needs network, run outside the sandbox).
- `node --check evals/grade.mjs`; `bash evals/fixtures/build.sh <dir>` builds 7 fixtures.

## Pointers
- Journal: `.ai/journal/2026-11-03.md`
- Evals: `evals/evals.json`, `evals/grade.mjs`, `evals/run-prompt.md`
