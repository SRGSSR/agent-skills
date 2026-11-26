---
name: finish
description: "Finishes the work on the current branch. It checks that everything is done and documented (commits, branch and base up to date with origin, no conflicts with the base, build and tests, handoff, docs, decisions, follow-ups, debt) and stops to explain and ask if not. Otherwise it closes the branch the way the user names, `merge` (git flow feature finish, or a merge into the branch it started from) or `mr` / `pr` (prepares a merge request or pull request). Use this skill whenever the user types `/finish` with or without `merge`, `mr`, `merge-request`, `pr`, `pull-request` or `help` and optional instructions after it, or asks to finish, wrap up or close the feature or branch, merge it, or open a merge or pull request for it. Part of the work-journal plugin; `/start` begins the work, `/pause` suspends it."
license: MIT
argument-hint: "<merge | merge-request | mr | pull-request | pr | help> [instructions]"
metadata:
  version: "0.9.2"
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

The git checks (the first six below) run in one command, from the repo: `sh <this skill's folder>/scripts/git-checks.sh [<base>]`, the base only if the user named one. It prints one line per check and changes nothing but the remote-tracking refs; lines starting with `problem:` go in the report, `ask:` is a question for the user, and a failed fetch is said in the report. Where `sh` isn't on PATH but you have a Bash tool that runs Git Bash (Claude Code on Windows, with PowerShell as the main shell), run the script with that tool. Where nothing can run it, run the same commands by hand, each one: `git fetch origin`; for the branch and the base `git rev-list --count <x>..origin/<x>`; `git merge-tree --write-tree --name-only HEAD <base>`, and again with `origin/<base>` if `git rev-parse` gives it another commit; `git status --porcelain`; `git worktree list`, and for each agent worktree `git -C <path> status --porcelain` and `git cherry HEAD <its branch>`.

- **Branch:** a work branch, not the development or default branch. On a `hotfix/` or `release/` branch, stop and ask: finishing one is a release (merges into the default and development branches, and a tag).
- **Base:** the handoff's `Base:`. Without it: with git flow, its development branch; otherwise the candidate (`develop`, the default branch) whose merge base with this branch is the most recent. Propose it and get a yes. A base that no longer exists: stop.
- **Up to date with origin:** the branch and the base, after `git fetch origin`. Each one behind is a problem of its own: "`<x>` is not up to date with `origin/<x>`, what do you want to do?", with the options "Update it before continuing" (resolving any conflicts it brings) and "Continue without updating". A branch that isn't on `origin` is skipped, and the whole check with no `origin` remote; a fetch that fails (offline, not logged in) is said in the report and doesn't stop.
- **Conflicts with the base**, and with `origin/<base>` if it points elsewhere: name the files and say they must be resolved before the branch is closed: "resolve them now?" There is no continuing without it. Git older than 2.38 can't run this check: say so.
- **Working tree:** uncommitted changes are listed; ask whether they belong to the work.
- **Agent worktrees:** only those an agent tool created for its subagents (Claude Code: `.claude/worktrees/agent-<id>` on the branch `worktree-agent-<id>`), never the user's own. Each one with uncommitted changes or with commits whose changes are not in this branch is listed: ask whether that work belongs to the branch or can be dropped. The others hold nothing left and go in step 2.
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

**Updating and resolving**, after the user's yes, never on your own:

- A branch only behind: fast-forward, `git merge --ff-only origin/<x>` if it is checked out, `git fetch origin <x>:<x>` if not. Behind with local commits too: merge, never rebase: `git merge origin/<x>` on that branch (for the base: `git switch <base>`, merge, `git switch` back).
- Conflicts with the base: merge the base, updated if the user chose so, into the branch: `git merge <base>`.
- When a merge stops on conflicts, resolve each one keeping what both sides meant; where they contradict, or a side's intent is unclear, ask. Report how each file was resolved, run the build and tests again, then commit the merge.
- Then run the checks again from the top.

In soft mode the report keeps its tone: what is missing is offered as a short list of last things to settle, not as failures. After the final report of step 3, name the tasks assigned to the user and offer the next one, as that section says.

## 2. Close the work on the branch

All modes: close the branch's task (delete its task file; for a tracker see step 3), delete the handoff, add the journal entry for the end of the task (what was done, what moved where, the new tasks), and commit on the branch (`finish: <task>`).

Then remove the agent worktrees of step 1 that hold nothing left, and those the user said to drop: `git worktree remove <path>` (`--force` only for a dropped one), then `git branch -D <its branch>`: `-D` because its commits may be in this branch as cherry-picks, which `-d` doesn't see. Only these temporary branches, never a work branch. Report what was removed.

## 3. Integrate

### `merge`

- git flow: `GIT_MERGE_AUTOEDIT=no git flow feature finish <name>` (merges into the development branch, deletes the branch).
- Otherwise: `git switch <base>`, `git merge --no-ff <branch>`, then `git branch -d <branch>`: only the local branch, only once merged, never `-D` and never the remote one.
- If the base is the default branch (`main`, `master`), ask once before merging: many teams protect it and review there; mention `/finish pr` or `mr`.
- Conflicts (the base moved after the check): stop, list the files, and ask whether to resolve them, as in step 1, or abort the merge. Don't resolve them on your own.
- A local merge doesn't trigger `Closes #42`: for a tracker task, propose closing it (`glab issue close`, `gh issue close`, Jira: transition to Done), and run it after the user's yes.
- Report the merge commit and the deleted branch, and that nothing was pushed.

### `mr`, `pr`

Read [`references/merge-request.md`](references/merge-request.md) and follow it: title, description, reviewer and assignee, then the command after the user's yes. Draft the description before step 2 deletes the task file and the handoff it is built from.
