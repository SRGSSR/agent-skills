#!/bin/sh
# Tests the plugins' SessionStart hooks on throwaway repos: sh scripts/test-hooks.sh (CI runs it).
# Every git command names its repo with -C, so a failed mktemp stops the script instead of touching this repo.
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
wj="$here/plugins/work-journal/hooks/session-start.sh"
pp="$here/plugins/project-phase/hooks/session-start.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/test-hooks.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
fails=0

# expect <name> <dir> <hook> <expected systemMessage, empty = silent>
expect() {
  out=$(cd "$2" && sh "$3")
  if [ -z "$4" ]; then got=$out; else
    got=$(printf %s "$out" | node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8"));process.stdout.write(j.systemMessage)') || got="invalid JSON: $out"
  fi
  if [ "$got" = "$4" ]; then echo "ok   $1"; else echo "FAIL $1: got [$got], want [$4]"; fails=$((fails + 1)); fi
}
commit() { git -C "$r" add -A && git -C "$r" -c user.name=t -c user.email=t@t commit -qm "$1"; }

mkdir "$tmp/plain"
expect "work-journal: not a repo" "$tmp/plain" "$wj" ""
expect "project-phase: no block" "$tmp/plain" "$pp" ""

r="$tmp/repo"
git init -q -b develop "$r"
printf '<!-- work-journal:start -->\nx\n<!-- work-journal:end -->\n' > "$r/AGENTS.md"
commit init
expect "work-journal: nothing to resume" "$r" "$wj" ""

git -C "$r" switch -qc 'feature/a"b'
mkdir -p "$r/.ai/handoff" "$r/sub"
echo '# h' > "$r/.ai/handoff/feature-a\"b.md"
commit handoff
expect "work-journal: handoff of the current branch" "$r" "$wj" 'work-journal · feature/a"b has a handoff: /start resumes it, /pause parks it, /finish closes it.'
expect "work-journal: from a subfolder" "$r/sub" "$wj" 'work-journal · feature/a"b has a handoff: /start resumes it, /pause parks it, /finish closes it.'

git -C "$r" switch -q develop
expect "work-journal: paused work on another branch" "$r" "$wj" 'work-journal · paused work on feature/a"b: /start <branch> resumes it.'

git -C "$r" checkout -q --detach
expect "work-journal: detached HEAD" "$r" "$wj" ""
git -C "$r" switch -q develop

echo '<!-- work-journal:off -->' > "$r/AGENTS.md"
expect "work-journal: off" "$r" "$wj" ""

printf '<!-- project-phase:start -->\nx\n<!-- project-phase:end -->\n' > "$r/AGENTS.md"
mkdir -p "$r/.ai"
printf '# Project phase\n\nCurrent: stabilize (since 2026-11-04)\n' > "$r/.ai/phase.md"
expect "project-phase: current phase" "$r" "$pp" "project-phase · stabilize (since 2026-11-04)"
echo '<!-- project-phase:off -->' > "$r/AGENTS.md"
expect "project-phase: off" "$r" "$pp" ""

[ "$fails" -eq 0 ] || { echo "$fails failed"; exit 1; }
