#!/bin/sh
# work-journal SessionStart hook, Claude Code only: other tools rely on the AGENTS.md block alone.
# Claude Code can't speak first, so this tells the user, and Claude, where the work stands.
# Silent outside a repo with the work-journal block, or when there is nothing to resume. Never fails a session.
# POSIX sh and git only, no node or jq: Claude Code on Windows runs hooks in Git Bash.

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0
grep -qs '<!-- work-journal:start -->' AGENTS.md || exit 0
branch=$(git branch --show-current 2>/dev/null)
[ -n "$branch" ] || exit 0

handoff() { printf '.ai/handoff/%s.md' "$(printf %s "$1" | tr / -)"; }

# A handoff is committed on its own branch, so paused work is found in the other branches, not in this tree.
# ponytail: local branches only, teammates' work pushed to origin is left to the skills.
paused=$(git for-each-ref --format='%(refname:short)' refs/heads | while read -r b; do
  [ "$b" = "$branch" ] && continue
  git cat-file -e "$b:$(handoff "$b")" 2>/dev/null && printf '%s, ' "$b"
done)
paused=${paused%, }

file=$(handoff "$branch")
if [ -f "$file" ]; then
  msg="work-journal · $branch has a handoff: /start resumes it, /pause parks it, /finish closes it."
  ctx="The current branch $branch has a handoff, $file. Before answering the user's first message, resume as in the work-journal skill, Resuming: read it and the last entries of the newest .ai/journal file, check them against the git state, and recap goal, status and next step in a few lines."
elif [ -n "$paused" ]; then
  msg="work-journal · paused work on $paused: /start <branch> resumes it."
  ctx="Local branches with a handoff (paused work): $paused. If the user's first message is a greeting, vague, or asks what to do, list them and offer /start <branch> or /backlog. Don't resume one unasked."
else
  exit 0
fi

json() { printf %s "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$(json "$msg")" "$(json "$ctx")"
