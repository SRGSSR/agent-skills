---
name: finish
description: "Finishes the work on the current branch. It checks that everything is done and documented (commits, build and tests, handoff, docs, decisions, follow-ups, debt) and stops to explain and ask if not. Otherwise it closes the branch the way the user names, `merge` (git flow feature finish, or a merge into the branch it started from) or `mr` / `pr` (prepares a merge request or pull request). Use this skill whenever the user types `/finish` with or without `merge`, `mr`, `merge-request`, `pr`, `pull-request` or `help` and optional instructions after it, or asks to finish, wrap up or close the feature or branch, merge it, or open a merge or pull request for it. Part of the work-journal plugin; `/start` begins the work, `/pause` suspends it."
license: MIT
argument-hint: "<merge | merge-request | mr | pull-request | pr | help> [instructions]"
metadata:
  version: "0.7.0"
---

# Finish

`/finish <mode> [instructions]` closes the work on the current branch. The mode is required, because it is the user's choice of how the work gets integrated:

| Mode | Does |
|---|---|
| `merge` | git flow: `git flow feature finish`. Otherwise a merge into the branch it started from, then deletes the branch. |
| `merge-request`, `mr` | Prepares a GitLab merge request into the base. |
| `pull-request`, `pr` | Prepares a GitHub pull request into the base. |

`/finish help` shows this table, the base the branch would go into (the handoff's `Base:`, or "to confirm" without one) and, in one line, what gets checked before (step 1). Read only the handoff; run nothing else.

Without a mode, or with another first word, show this table in one line and stop: never pick or recommend a mode. A request in words counts when it names the mode ("finish and merge it", "open a PR"); "finish the feature" alone doesn't, so ask.

Text after the mode is instructions for this run: options of the request (draft, reviewers, labels), a title, what to add to the journal entry, a check problem the user accepts ("tests fail only on CI, known"). Follow them. An accepted problem is still reported, but doesn't stop. They never lift the rules here: no push, no force, and every check still runs.

Never push, force or rewrite history. Formats are in the [work-journal skill](../work-journal/SKILL.md); tracker commands in the [backlog skill](../backlog/SKILL.md). Talk in the user's language.

## 1. Check

Run every check, then report all problems at once. If there is any, stop: one line per problem with what would fix it, and ask. Don't fix them without the user's yes.

- **Branch:** a work branch, not the development or default branch. On a `hotfix/` or `release/` branch, stop and ask: finishing one is a release (merges into the default and development branches, and a tag).
- **Base:** the handoff's `Base:`. Without it: with git flow, its development branch; otherwise the candidate (`develop`, the default branch) whose merge base with this branch is the most recent (`git log -1 --format=%ci $(git merge-base HEAD <candidate>)`). Propose it and get a yes. A base that no longer exists: stop.
- **Working tree:** uncommitted changes are listed; ask whether they belong to the work.
- **Agent worktrees:** in `git worktree list`, only those an agent tool created for its subagents (Claude Code: `.claude/worktrees/agent-<id>` on the branch `worktree-agent-<id>`), never the user's own. Each one with uncommitted changes (`git -C <path> status --porcelain`) or with commits whose changes are not in this branch (`git cherry HEAD <its branch>`, lines starting with `+`; `-` means already in this branch) is listed: ask whether that work belongs to the branch or can be dropped. The others hold nothing left and go in step 2.
- **Build and tests:** the commands in the project's instructions (`AGENTS.md`, `CLAUDE.md`, README, package scripts). A failure stops; no commands found, say so.
- **Handoff:** no open status items or next steps, no open questions for the user.
- **Reminders:** none left under the handoff's `## Reminders`. List each one left with what you would do with it: done, dropped or a task. The user answers one by one; dropping is a fine answer.
- **Docs**, for what the branch changed (`git diff --stat <base>...HEAD`), not an audit of all docs:
  - everything new a user can see (command, option, config, file format, behavior) is described where users look for it: README, the guide on that topic, help texts;
  - where the docs show examples for similar things (a command line, a config block, an output), the new one has one too; if the project's docs use no examples, none is required;
  - nothing still describes the old behavior: `grep` the docs for names the branch renamed or removed;
  - rules the project sets for its docs (in `AGENTS.md` or `CLAUDE.md`) hold.

  Name each gap with the file where it belongs.
- **What must last:** decisions and dead ends moved where people look, follow-ups and open questions filed as tasks, deliberate shortcuts in `.ai/debt.md` if project-phase is in use (work-journal, [When the branch's task is done](../work-journal/SKILL.md#when-the-branchs-task-is-done)). In [soft mode](../work-journal/SKILL.md#soft-mode) follow-ups and open questions are not filed on their own: they are closed one by one like reminders.

In soft mode the report keeps its tone: what is missing is offered as a short list of last things to settle, not as failures. After the final report of step 3, name the tasks assigned to the user and offer the next one, as that section says.

## 2. Close the work on the branch

All modes: close the branch's task (delete its task file; for a tracker see step 3), delete the handoff, add the journal entry for the end of the task (what was done, what moved where, the new tasks), and commit on the branch (`finish: <task>`).

Then remove the agent worktrees of step 1 that hold nothing left, and those the user said to drop: `git worktree remove <path>` (`--force` only for a dropped one), then `git branch -D <its branch>`: `-D` because its commits may be in this branch as cherry-picks, which `-d` doesn't see. Only these temporary branches, never a work branch. Report what was removed.

## 3. Integrate

### `merge`

- git flow: `GIT_MERGE_AUTOEDIT=no git flow feature finish <name>` (merges into the development branch, deletes the branch).
- Otherwise: `git switch <base>`, `git merge --no-ff <branch>`, then `git branch -d <branch>`: only the local branch, only once merged, never `-D` and never the remote one.
- If the base is the default branch (`main`, `master`), ask once before merging: many teams protect it and review there; mention `/finish pr` or `mr`.
- Conflicts: stop, list the files, and ask whether to resolve them or abort the merge. Don't resolve them on your own.
- A local merge doesn't trigger `Closes #42`: for a tracker task, propose closing it (`glab issue close`, `gh issue close`, Jira: transition to Done), and run it after the user's yes.
- Report the merge commit and the deleted branch, and that nothing was pushed.

### `mr`, `pr`

- `mr` uses `glab`, `pr` uses `gh`; if it doesn't match the host of `origin`, say so and ask. Not logged in: see the backlog skill, [Not logged in](../backlog/SKILL.md#not-logged-in).
- The branch must be on the remote and up to date (`git status -sb`). If it isn't, give the user `git push -u origin <branch>` in the same message as the title, body and command below (one stop, not two), and create nothing until they say it is pushed. Never pass `--push` or `--fill`, which push.
- **Title:** the task title, after the Jira key if there is one (`PODCAST-42 CSV export`).
- **Body:** see [The description](#the-description). Draft it before step 2 deletes the task file and the handoff it is built from.
- **Reviewer and assignee** are two things: the reviewer checks and approves the request, the assignee carries it to the merge (often the author). Each one named in the instructions (a person, "me", "nobody"): follow them. For each one they don't name, ask in the same message, as one question: who reviews it (someone, nobody), and whom to assign it to (the user, someone else, nobody). Never pick either yourself, and never propose the user as their own reviewer. A name is resolved as in the backlog skill, [People](../backlog/SKILL.md#people-aiteammd). The flags are `--reviewer <handle>` and `--assignee <handle>` for both tools (`gh`: `@me` for the user as assignee; `glab`: the username `glab auth status` shows).
- Show title, body and the exact command, and run it after the user's yes:
  - `gh pr create --base <base> --title "<title>" --body-file -`, body on stdin;
  - `glab mr create --target-branch <base> --title "<title>" --description-file - --yes`, body on stdin.
- The commit of step 2 is part of the request, so merging it closes everything. If the review asks for changes, the next agent on the branch writes a new handoff. A Jira work item moves to Done after the merge, by Jira automation or by hand (`acli jira workitem transition`).
- Report the URL.

#### The description

The reviewer was not in the conversation and may test the work days later: the description alone must tell them what it is, what changed and how to check it. Three parts, in this order, in the language of the project's issues and commits:

1. **Introduction**, no heading, two to four lines: what the request does and why. Someone who stops reading here knows what they are approving.
2. **`## Changes`**, in detail: what changed and where (files, components, pages, commands, config), grouped by area for a large branch; the decisions a reviewer would question, each with its reason; what was left out on purpose; what needs care when merging (migration, new config or dependency, changed public behavior). From the commits, `git diff --stat <base>...HEAD`, the handoff and the journal.
3. **`## How to test`**, everything a tester needs, with no question left to ask:
   - **Specifications:** what the work had to do: the task's `Done when` or acceptance criteria, one line each, with a link to every issue it comes from (`#42` on the same host, the full URL elsewhere, the Jira key). No written specification: say so and give the handoff's goal.
   - **Setup:** what is needed first (install, config, data, migration, accounts), if anything.
   - **Steps:** numbered, each with what to do and what must happen. First the automated tests (the command, what they cover), then by hand what they don't cover, one step per specification line.
   - **Edge cases:** those the work handles (empty or very large input, invalid values, limits, permissions, errors, old data), each with how to try it and the expected result; then those it does not handle or that nobody tried, said as such.

Last, `Closes #42` for each issue on the same host, or the Jira key.

Write only what is true: a step nobody ran is marked "not run", a specification with no link gets none, and nothing is invented to fill a part. A small change gets short parts, but all three: a part with nothing to say says so in one line. Check failures the user accepted go under Changes.
