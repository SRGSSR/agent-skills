# Two subagent worktrees (Claude Code layout) still holding work: one with an
# uncommitted change, one with a commit that is not in the branch. /finish must stop and ask.
mkdir -p .git/info && printf '.claude/\nnode_modules/\n' >>.git/info/exclude
w1=.claude/worktrees/agent-b71d04
g worktree add -q --relative-paths -b worktree-agent-b71d04 "$w1" HEAD
printf '\n// TODO: prefix cells starting with = + - @ (formula injection in Excel)\n' >>"$w1/export.js"
w2=.claude/worktrees/agent-e5c812
g worktree add -q --relative-paths -b worktree-agent-e5c812 "$w2" HEAD
cat >"$w2/test/newline.test.js" <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../export.js';

test('a newline in a name is quoted', () => {
  const csv = toCsv([{ name: 'a\nb', qty: 1, tags: [], createdAt: '2026-10-01' }]);
  assert.match(csv, /"a\nb"/);
});
JS
g -C "$w2" add test/newline.test.js
GIT_AUTHOR_DATE=2026-10-01T16:50:00 GIT_COMMITTER_DATE=2026-10-01T16:50:00 g -C "$w2" commit -qm "test: newline in a name"
