# Handoff
Updated: 2026-11-25 · by: claude-code/claude-opus-5-5
Branch: feature/sh-fallback · Base: develop · Last commit: see git log · Uncommitted: none
Phase: stabilize

## Goal
Make the fallback for `finish/scripts/git-checks.sh` explicit and verified, for agents where `sh` doesn't run (Windows without Git Bash on PATH):
1. `start/SKILL.md`: say that without `sh` the resume checks are done by hand, as in `/finish`.
2. An eval of the fallback: an agent that can't run `sh` still does every git check of `/finish` step 1, with the same questions.
3. Setup (`work-journal/references/setup.md`): on Windows, look for `sh.exe` of Git for Windows (not in `cmd/` next to the `git.exe` on PATH, but in `bin/` and `usr/bin/` of the same install) and, if it isn't on PATH, suggest adding it; never change PATH itself.
Done when the three are in, checks and evals pass, docs updated.

## Status
- [x] 1. start and finish (0.4.3, 0.9.1): without sh, the git commands by hand, named in one line of finish step 1
- [x] 2. Evals 58-59 (environment field): 58 passes 3/3, 59 1/1 with the final text; earlier wordings failed 58 (docs/design.md)
- [x] 3. Setup step 7 (work-journal 0.18.0): on Windows suggests <install>/bin on PATH; not tried on Windows

## Next steps
None: the work is done; `/finish` closes it.

## Pointers
- Request in the conversation of 2026-11-25, after `/finish merge` of feature/scripts; design notes `docs/design.md` "Token cost and scripts".
