#!/bin/sh
# project-phase SessionStart hook, Claude Code only: shows the user the current phase. Claude already has the
# contract block from AGENTS.md, so nothing goes to its context. Silent without the block (also when off).
# POSIX sh, no node or jq: Claude Code on Windows runs hooks in Git Bash. Never fails a session.

root=$(git rev-parse --show-toplevel 2>/dev/null) || root=.
cd "$root" || exit 0
grep -qs '<!-- project-phase:start -->' AGENTS.md || exit 0
# "Current: stabilize (since 2026-11-04)" → "stabilize (since 2026-11-04)"
phase=$(sed -n 's/^Current: *//p' .ai/phase.md 2>/dev/null | head -n 1)
[ -n "$phase" ] || exit 0

json() { printf %s "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
printf '{"systemMessage":"%s"}\n' "$(json "project-phase · $phase")"
