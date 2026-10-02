#!/usr/bin/env bash
# Builds the eval fixture repos with a realistic git history.
#
# Usage: evals/fixtures/build.sh <out-dir>
# Creates <out-dir>/<fixture>/with_skill and <out-dir>/<fixture>/without_skill.
# with_skill additionally contains the fixture's skill-state/ files (AGENTS.md, .ai/),
# committed on top of the history, as if the skills had been set up earlier.
#
# history.txt format, one entry per line:
#   ISO_DATE|commit message|comma-separated files added in this commit (optional)
#   @branch <name>    switch to a new branch
# Files not claimed by any entry are added by the first commit.
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
  (
    cd "$dest"
    g init -q --template=
    local claimed
    claimed="$(grep -v '^@' "$src/history.txt" | cut -d'|' -f3 | tr ',' '\n' | sed '/^$/d' || true)"
    local first=1 last_date=""
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if [[ "$line" == @branch* ]]; then
        g checkout -q -b "${line#@branch }"
        continue
      fi
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
    if [ "$variant" = with_skill ] && [ -d "$src/skill-state" ]; then
      cp -R "$src/skill-state/." .
      g add -A
      GIT_AUTHOR_DATE="$last_date" GIT_COMMITTER_DATE="$last_date" g commit -q -m "docs: update agent instructions and work state"
    fi
  )
}

for dir in "$HERE"/*/; do
  fixture="$(basename "$dir")"
  build_variant "$fixture" with_skill
  build_variant "$fixture" without_skill
  echo "built $fixture"
done
