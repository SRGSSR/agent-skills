#!/usr/bin/env bash
# Builds the eval fixture repos with a realistic git history.
#
# Usage: evals/fixtures/build.sh <out-dir>
# Creates <out-dir>/<fixture>/with_skill and <out-dir>/<fixture>/without_skill.
# with_skill additionally contains the fixture's skill-state/ files (AGENTS.md, .ai/),
# committed on top of the history, as if the skills had been set up earlier.
# A fixture with a `state-in-baseline` file gets skill-state/ in without_skill too
# (on/off evals: same repo state, only the skill is missing). base/ and history.txt
# may be symlinks to another fixture's; files in an optional extra/ are copied on top of base/.
#
# history.txt format, one entry per line:
#   ISO_DATE|commit message|comma-separated files added in this commit (optional)
#   @branch <name>    switch to a new branch
#   @checkout <name>  switch to an existing branch
#   @merge <name> <ISO_DATE>  merge <name> into the current branch (no fast-forward)
#   @state <ISO_DATE> commit skill-state/ here instead of at the end (if this variant gets it)
# Files not claimed by any entry are added by the first commit.
# An optional `remote` file holds the URL set as `origin` (never fetched).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:?usage: build.sh <out-dir>}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

export GIT_AUTHOR_NAME="Dev Team" GIT_AUTHOR_EMAIL="dev@example.com"
export GIT_COMMITTER_NAME="Dev Team" GIT_COMMITTER_EMAIL="dev@example.com"

g() { git -c commit.gpgsign=false -c init.defaultBranch=main "$@"; }

build_variant() {
  local fixture="$1" variant="$2"
  local src="$HERE/$fixture" dest="$OUT/$fixture/$variant"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$src/base/." "$dest/"
  [ -d "$src/extra" ] && cp -R "$src/extra/." "$dest/"
  (
    cd "$dest"
    g init -q --template=
    [ -f "$src/remote" ] && g remote add origin "$(cat "$src/remote")"
    local claimed
    claimed="$(grep -v '^@' "$src/history.txt" | cut -d'|' -f3 | tr ',' '\n' | sed '/^$/d' || true)"
    local first=1 last_date="" state_done=0
    local with_state=0
    { [ "$variant" = with_skill ] || [ -f "$src/state-in-baseline" ]; } && [ -d "$src/skill-state" ] && with_state=1
    commit_state() {
      cp -R "$src/skill-state/." .
      (cd "$src/skill-state" && find . -type f) | while IFS= read -r f; do g add -- "$f"; done
      GIT_AUTHOR_DATE="$1" GIT_COMMITTER_DATE="$1" g commit -q -m "docs: update agent instructions and work state"
    }
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      case "$line" in
        @branch\ *) g checkout -q -b "${line#@branch }"; continue ;;
        @checkout\ *) g checkout -q "${line#@checkout }"; continue ;;
        @merge\ *)
          set -- ${line#@merge }
          GIT_AUTHOR_DATE="$2" GIT_COMMITTER_DATE="$2" g merge -q --no-ff --no-edit "$1"
          continue ;;
        @state\ *)
          [ "$with_state" = 1 ] && commit_state "${line#@state }"
          state_done=1; continue ;;
      esac
      local date msg files
      date="$(cut -d'|' -f1 <<<"$line")"
      msg="$(cut -d'|' -f2 <<<"$line")"
      files="$(cut -d'|' -f3 <<<"$line")"
      if [ "$first" = 1 ]; then
        g add -A
        [ -n "$claimed" ] && while IFS= read -r f; do g reset -q -- "$f"; done <<<"$claimed"
        first=0
      elif [ -n "$files" ]; then
        tr ',' '\n' <<<"$files" | while IFS= read -r f; do g add -- "$f"; done
      fi
      GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" g commit -q --allow-empty -m "$msg"
      last_date="$date"
    done <"$src/history.txt"
    if [ "$with_state" = 1 ] && [ "$state_done" = 0 ]; then
      commit_state "$last_date"
    fi
  )
}

for dir in "$HERE"/*/; do
  fixture="$(basename "$dir")"
  build_variant "$fixture" with_skill
  build_variant "$fixture" without_skill
  echo "built $fixture"
done
