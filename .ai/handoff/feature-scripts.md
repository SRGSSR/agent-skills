# Handoff
Updated: 2026-11-25 · by: claude-code/claude-opus-5-5
Branch: feature/scripts · Base: develop · Last commit: bf9e577 · Uncommitted: none
Phase: stabilize

## Goal
Cut the tokens the skills spend and make deterministic steps reliable, in four steps, measuring each:
1. Split the big skills (backlog, request, work-journal, finish) into a short SKILL.md plus `references/*.md` read only when needed.
2. `git-checks.sh` shared by `/finish` (step 1 checks) and `/start` resume: branch, origin, conflicts, working tree, agent worktrees.
3. A listing script for `/backlog` (task folder and GitHub first), only if measurements show it pays off.
4. A script that aligns the columns of `.ai/team.md`.
Done when each step is implemented (or dropped with data and the user's ok), checks and evals pass, docs updated.

## Status
- [ ] 1. Split skills
- [ ] 2. git-checks.sh
- [ ] 3. backlog listing script
- [ ] 4. team.md aligner

## Next steps
1. Measure the baseline: tokens of a `/backlog` listing eval (`claude -p --output-format json`) on a fixture, before the split.

## Decisions
- Scripts in POSIX sh + git where possible (Windows Git Bash, as for the hooks).

## How to verify
- `node scripts/check-skills.mjs`, `sh scripts/test-hooks.sh`, `claude plugin validate --strict .`, evals in `evals/`.

## Pointers
- Evaluation in the conversation of 2026-11-25; design notes `docs/design.md`.
