---
name: finish
description: Finishes the work on the current branch. It checks that everything is done and documented (commits, build and tests, handoff, docs, decisions, follow-ups, debt) and stops to explain and ask if not. Otherwise it closes the branch the way the user names, `merge` (git flow feature finish, or a merge into the branch it started from) or `mr` / `pr` (prepares a merge request or pull request). Use this skill whenever the user types `/finish` with or without `merge`, `mr`, `merge-request`, `pr`, `pull-request` or `help` and optional instructions after it, or asks to finish, wrap up or close the feature or branch, merge it, or open a merge or pull request for it. Part of the work-journal plugin; `/start` begins the work.
license: MIT
argument-hint: "<merge | merge-request | mr | pull-request | pr | help> [instructions]"
metadata:
  version: "0.4.0"
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
- **Build and tests:** the commands in the project's instructions (`AGENTS.md`, `CLAUDE.md`, README, package scripts). A failure stops; no commands found, say so.
- **Handoff:** no open status items or next steps, no open questions for the user.
- **Docs**, for what the branch changed (`git diff --stat <base>...HEAD`), not an audit of all docs:
  - everything new a user can see (command, option, config, file format, behavior) is described where users look for it: README, the guide on that topic, help texts;
  - where the docs show examples for similar things (a command line, a config block, an output), the new one has one too; if the project's docs use no examples, none is required;
  - nothing still describes the old behavior: `grep` the docs for names the branch renamed or removed;
  - rules the project sets for its docs (in `AGENTS.md` or `CLAUDE.md`) hold.

  Name each gap with the file where it belongs.
- **What must last:** decisions and dead ends moved where people look, follow-ups and open questions filed as tasks, deliberate shortcuts in `.ai/debt.md` if project-phase is in use (work-journal, [When the branch's task is done](../work-journal/SKILL.md#when-the-branchs-task-is-done)).

## 2. Close the work on the branch

All modes: close the branch's task (delete its task file; for a tracker see step 3), delete the handoff, add the journal entry for the end of the task (what was done, what moved where, the new tasks), and commit on the branch (`finish: <task>`).

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
- The branch must be on the remote and up to date (`git status -sb`). If it isn't, give the user `git push -u origin <branch>` and stop until they say it is done. Never pass `--push` or `--fill`, which push.
- **Title:** the task title, after the Jira key if there is one (`PODCAST-42 CSV export`). **Body:** the goal in one line, what changed (a few bullets from the commits and the handoff's status), how to verify (from the handoff), then `Closes #42` for an issue on the same host, or the Jira key.
- Show title, body and the exact command, and run it after the user's yes:
  - `gh pr create --base <base> --title "<title>" --body-file -`, body on stdin;
  - `glab mr create --target-branch <base> --title "<title>" --description-file - --yes`, body on stdin.
- The commit of step 2 is part of the request, so merging it closes everything. If the review asks for changes, the next agent on the branch writes a new handoff. A Jira work item moves to Done after the merge, by Jira automation or by hand (`acli jira workitem transition`).
- Report the URL.
