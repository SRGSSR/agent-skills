# Handoff
Updated: 2026-11-26 · by: claude-code/claude-opus-5-5
Branch: feature/windows-bash-tool · Base: develop · Last commit: see git log · Uncommitted: none
Phase: stabilize

## Goal
On native Windows, Claude Code runs the Bash tool and command hooks in Git Bash when Git for Windows is installed, and uses PowerShell otherwise (code.claude.com docs: setup, tools-reference, hooks). With the PowerShell tool as primary shell, `sh` may not be on PATH while the Bash tool still has it.
1. `finish/SKILL.md` step 1 and `start/SKILL.md`: where `sh` isn't on PATH but the agent has a Bash tool in Git Bash (Claude Code on Windows), run the script there; the by-hand commands stay the last resort.
2. `docs/design.md`: hooks run in Git Bash only when Git for Windows is installed; without it they run in PowerShell, `sh` fails, the session starts without the hook's message (non-blocking error) and resuming relies on the AGENTS.md block. Discarded: a check in the hook that suggests PATH (Git Bash always has sh; without Git Bash the hook can't run).
Done when both are in, versions bumped, checks pass, docs updated.

## Status

## Next steps
- Edit the fallback sentence in `finish/SKILL.md` step 1 and its pointer in `start/SKILL.md`.

## Pointers
- Request in the conversation of 2026-11-26; design notes `docs/design.md` "Session start hooks" and "Token cost and scripts".
