#!/bin/sh
# The git checks of /finish (step 1) and of /start when it resumes, in one run.
# Usage: sh git-checks.sh [base]   (run inside the repo; base defaults to the handoff's `Base:`)
# Prints one line per check; a line starting with `problem:` needs the user. Changes nothing
# but the remote-tracking refs (`git fetch origin`). POSIX sh and git only, like the hooks.
# What it can't decide (the base when nothing names it) it prints as `ask:` for the agent.

root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "problem: not a git repository"; exit 1; }
cd "$root" || exit 1

branch=$(git branch --show-current)
[ -n "$branch" ] || { echo "problem: detached HEAD, not on a branch"; exit 0; }

develop=$(git config --get gitflow.branch.develop)
default=$(git symbolic-ref --short -q refs/remotes/origin/HEAD 2>/dev/null)
default=${default#origin/}
[ -n "$default" ] || default=$(git config --get gitflow.branch.master)
if [ -z "$default" ]; then
  for b in main master; do git show-ref -q --verify "refs/heads/$b" && { default=$b; break; }; done
fi

case "$branch" in
  hotfix/* | release/*) echo "problem: branch $branch: finishing a hotfix or release is a release (default and development branch, tag): ask" ;;
  "$develop" | "$default" | develop) echo "problem: branch $branch is the development or default branch, not a work branch" ;;
  *) echo "branch: $branch" ;;
esac

handoff=".ai/handoff/$(printf %s "$branch" | tr / -).md"
base=$1
if [ -n "$base" ]; then src=argument
else
  base=$(sed -n 's/.*Base: *\([^ ·]*\).*/\1/p' "$handoff" 2>/dev/null | head -n 1)
  src=handoff
fi
if [ -z "$base" ] && [ -n "$develop" ]; then base=$develop; src="git flow"; fi
if [ -z "$base" ]; then
  # The candidate whose merge base with this branch is the most recent.
  best=0
  for c in develop "$default"; do
    [ -n "$c" ] && [ "$c" != "$branch" ] && git show-ref -q --verify "refs/heads/$c" || continue
    t=$(git log -1 --format=%ct "$(git merge-base HEAD "$c")" 2>/dev/null) || continue
    [ "$t" -gt "$best" ] && { best=$t; base=$c; }
  done
  [ -n "$base" ] && echo "ask: base $base (most recent merge base; nothing names it): propose it and get a yes"
  src=guess
fi
if [ -z "$base" ]; then echo "problem: no base found: ask the user"
elif ! git show-ref -q --verify "refs/heads/$base"; then echo "problem: base $base ($src) does not exist"; base=
else echo "base: $base ($src)"
fi

# Up to date with origin. No prompts, and ssh gives up after 10 s instead of hanging (unless the user set their own ssh command).
fetched=
if git remote get-url origin >/dev/null 2>&1; then
  if [ -z "$GIT_SSH_COMMAND" ] && [ -z "$(git config --get core.sshCommand)" ]; then
    GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"; export GIT_SSH_COMMAND
  fi
  if err=$(GIT_TERMINAL_PROMPT=0 git fetch -q origin 2>&1); then fetched=1; echo "fetch: ok"
  else echo "fetch: failed ($(printf %s "$err" | head -n 1)); compared with the last known origin: say so in the report"
  fi
  for x in "$branch" $base; do
    if ! git show-ref -q --verify "refs/remotes/origin/$x"; then echo "origin: $x is not on origin"; continue; fi
    n=$(git rev-list --count "$x..origin/$x")
    if [ "$n" -gt 0 ]; then echo "problem: $x is $n commit(s) behind origin/$x: ask \"update it before continuing\" or \"continue without updating\""
    else echo "origin: $x up to date with origin/$x"
    fi
  done
else
  echo "origin: no origin remote, check skipped"
fi

# Conflicts with the base, and with origin/<base> if it points elsewhere.
if [ -n "$base" ]; then
  targets=$base
  git show-ref -q --verify "refs/remotes/origin/$base" &&
    [ "$(git rev-parse "$base")" != "$(git rev-parse "origin/$base")" ] && targets="$base origin/$base"
  for t in $targets; do
    out=$(git merge-tree --write-tree --name-only HEAD "$t" 2>&1); rc=$?
    case $rc in
      0) echo "conflicts: none with $t" ;;
      1) echo "problem: conflicts with $t, to resolve before closing: $(printf '%s\n' "$out" | sed -n '2,/^$/p' | sed '/^$/d' | tr '\n' ' ')" ;;
      *) echo "conflicts: check with $t not run (needs git 2.38 or later)" ;;
    esac
  done
fi

# Working tree.
dirty=$(git status --porcelain)
if [ -n "$dirty" ]; then echo "problem: uncommitted changes, ask whether they belong to the work: $(printf '%s\n' "$dirty" | tr '\n' ';')"
else echo "working tree: clean"
fi

# Worktrees an agent tool created for its subagents (Claude Code: .claude/worktrees/agent-<id>), never the user's own.
git worktree list --porcelain | sed -n 's/^worktree //p' | while read -r wt; do
  case "$wt" in */.claude/worktrees/agent-*) ;; *) continue ;; esac
  wb=$(git -C "$wt" branch --show-current)
  u=$(git -C "$wt" status --porcelain | wc -l | tr -d ' ')
  c=0
  [ -n "$wb" ] && c=$(git cherry HEAD "$wb" | grep -c '^+')
  if [ "$u" -gt 0 ] || [ "$c" -gt 0 ]; then
    echo "problem: agent worktree $wt ($wb): $u uncommitted, $c commit(s) not in this branch: ask whether it belongs to the work or can be dropped"
  else
    echo "agent worktree: $wt ($wb) holds nothing left: remove it in step 2"
  fi
done
