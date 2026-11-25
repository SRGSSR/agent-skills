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

## Next steps
- Read `start/SKILL.md` and the fallback sentence in `finish/SKILL.md` step 1; add the clause to start.

## Pointers
- Request in the conversation of 2026-11-25, after `/finish merge` of feature/scripts; design notes `docs/design.md` "Token cost and scripts".
