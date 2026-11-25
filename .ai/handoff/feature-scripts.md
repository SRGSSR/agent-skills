# Handoff
Updated: 2026-11-25 · by: claude-code/claude-opus-5-5
Branch: feature/scripts · Base: develop · Last commit: see git log · Uncommitted: none
Phase: stabilize

## Goal
Cut the tokens the skills spend and make deterministic steps reliable, in four steps, measuring each:
1. Split the big skills (backlog, request, work-journal, finish) into a short SKILL.md plus `references/*.md` read only when needed.
2. `git-checks.sh` shared by `/finish` (step 1 checks) and `/start` resume: branch, origin, conflicts, working tree, agent worktrees.
3. A listing script for `/backlog` (task folder and GitHub first), only if measurements show it pays off.
4. A script that aligns the columns of `.ai/team.md`.
Done when each step is implemented (or dropped with data and the user's ok), checks and evals pass, docs updated.

## Status
- [x] 1. Split skills (2ce7086), measured: -4k tokens per listing, same grades
- [x] 2. git-checks.sh (36573ec), measured: fewer tool calls, same grades
- [x] 3. No script: compact `--jq` listings in backlog and request (0cf5802)
- [x] 4. Dropped by the user: Sonnet aligned 3/3 (docs/design.md)
- [x] jira-team fixture: `.ai/team.md` added under `extra/` with `git add -f`; eval 31 passes

## Next steps
None: the work is done; `/finish` closes it.

## Open questions
- Jira listing with `acli --csv`: untested, needs a logged-in acli (follow-up).

## Decisions
- Scripts in POSIX sh + git where possible (Windows Git Bash, as for the hooks). See docs/design.md "Token cost and scripts".

## How to verify
- `node scripts/check-skills.mjs`, `sh scripts/test-hooks.sh`, `claude plugin validate --strict .`, evals in `evals/`.

## Pointers
- Evaluation in the conversation of 2026-11-25; design notes `docs/design.md`.
