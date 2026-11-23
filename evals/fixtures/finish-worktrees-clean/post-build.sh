# Leftovers of a session: a subagent worktree (Claude Code layout) whose commit was
# cherry-picked into the branch, with only ignored files left in it; and the user's
# own worktree with work of its own, which /finish must not touch.
mkdir -p .git/info && printf '.claude/\n.worktrees/\nnode_modules/\n' >>.git/info/exclude
w=.claude/worktrees/agent-a3f9c2
g worktree add -q --relative-paths -b worktree-agent-a3f9c2 "$w" HEAD
printf '\nExample: `toCsv([{ name: "Pen", qty: 2, tags: ["office"], createdAt: "2026-10-01" }])`.\n' >>"$w/docs/csv-export.md"
GIT_AUTHOR_DATE=2026-10-01T16:50:00 GIT_COMMITTER_DATE=2026-10-01T16:50:00 g -C "$w" commit -qam "docs: toCsv example"
GIT_COMMITTER_DATE=2026-10-01T16:55:00 g cherry-pick worktree-agent-a3f9c2 >/dev/null
mkdir -p "$w/node_modules/.cache" && echo '{}' >"$w/node_modules/.cache/state.json"
u=.worktrees/pdf-spike
g worktree add -q --relative-paths -b spike/pdf-export "$u" develop
echo '// PDF export spike: not started' >"$u/pdf.js"
g -C "$u" add pdf.js
GIT_AUTHOR_DATE=2026-10-01T17:10:00 GIT_COMMITTER_DATE=2026-10-01T17:10:00 g -C "$u" commit -qm "spike: pdf export"
