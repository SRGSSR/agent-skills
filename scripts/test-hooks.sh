#!/bin/sh
# Tests the plugins' SessionStart hooks and the skills' scripts on throwaway repos: sh scripts/test-hooks.sh (CI runs it).
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

# finish/scripts/git-checks.sh, on a repo with a local bare origin (no network).
gc="$here/plugins/work-journal/skills/finish/scripts/git-checks.sh"
# has <name> <dir> <expected line, a fixed string>
has() {
  out=$(cd "$2" && sh "$gc" 2>&1)
  if printf '%s\n' "$out" | grep -qxF -- "$3"; then echo "ok   $1"; else echo "FAIL $1: no [$3] in:"; printf '%s\n' "$out"; fails=$((fails + 1)); fi
}
o="$tmp/origin.git"
git init -q --bare "$o"
r="$tmp/gc"
git init -q -b develop "$r"
git -C "$r" remote add origin "$o"
echo a > "$r/doc.md"
commit init
git -C "$r" push -q origin develop
git -C "$r" switch -qc feature/x
mkdir -p "$r/.ai/handoff"
printf '# Handoff\nBranch: feature/x · Base: develop · Last commit: x\n' > "$r/.ai/handoff/feature-x.md"
echo branch > "$r/doc.md"
commit work
has "git-checks: base from the handoff" "$r" "base: develop (handoff)"
has "git-checks: no conflicts" "$r" "conflicts: none with develop"
has "git-checks: branch not on origin" "$r" "origin: feature/x is not on origin"

t="$tmp/teammate"
git clone -q -b develop "$o" "$t"
echo teammate > "$t/doc.md"
git -C "$t" -c user.name=t -c user.email=t@t commit -qam teammate
git -C "$t" push -q origin develop
has "git-checks: base behind origin" "$r" 'problem: develop is 1 commit(s) behind origin/develop: ask "update it before continuing" or "continue without updating"'
has "git-checks: conflicts with origin/develop" "$r" "problem: conflicts with origin/develop, to resolve before closing: doc.md "

echo dirty > "$r/new.txt"
has "git-checks: uncommitted changes" "$r" "problem: uncommitted changes, ask whether they belong to the work: ?? new.txt;"
rm "$r/new.txt"

git -C "$r" worktree add -q -b worktree-agent-1 "$r/.claude/worktrees/agent-1"
has "git-checks: agent worktree with nothing left" "$r" "agent worktree: $(cd "$r" && pwd -P)/.claude/worktrees/agent-1 (worktree-agent-1) holds nothing left: remove it in step 2"
git -C "$r" worktree remove "$r/.claude/worktrees/agent-1"

git -C "$r" switch -q develop
has "git-checks: on the development branch" "$r" "problem: branch develop is the development or default branch, not a work branch"
git -C "$r" switch -qc hotfix/y
has "git-checks: hotfix branch" "$r" "problem: branch hotfix/y: finishing a hotfix or release is a release (default and development branch, tag): ask"
git -C "$r" remote remove origin
has "git-checks: no origin" "$r" "origin: no origin remote, check skipped"

[ "$fails" -eq 0 ] || { echo "$fails failed"; exit 1; }
