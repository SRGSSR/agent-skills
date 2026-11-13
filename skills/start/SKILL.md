---
name: start
description: "Starts the work on a task or feature in a branch of its own, with the git flow feature start when the repo uses git flow, or otherwise a feature branch from the development branch. It records the branch it started from, writes the first handoff and journal entry, and for a task in a tracker offers to assign it to the user and mark it in progress. Use this skill whenever the user types `/start <task or name> [context]`. Also use it when they say they want to start or begin working on a task, issue, work item or feature (\"let's start on PODCAST-42\", \"begin the CSV export\"); then propose `/start` with the name instead of creating a branch on your own. Part of the work-journal plugin; `/finish` ends the work."
license: MIT
argument-hint: "<task or name> [context]"
metadata:
  version: "0.1.1"
---

# Start

`/start <task or name> [context]` opens one branch for one task, with its handoff from the first minute, so the work can be paused and resumed at any point. `<task or name>` is an issue (`#42`), a Jira key (`PODCAST-42`), a task file (`docs/backlog/csv-export.md`), a task title, or just a name; the optional context is a short description of the goal.

Formats of the handoff, journal and tasks are in the [work-journal skill](../work-journal/SKILL.md); task lookups and tracker commands in the [backlog skill](../backlog/SKILL.md). Talk in the user's language.

**Asked in words** ("let's work on PODCAST-42"): propose `/start PODCAST-42` with the branch name you would use, and wait. Never create a branch on your own.

## Steps

1. **Check where you are** (`git status --short`, `git branch --show-current`):
   - Uncommitted changes: list them and ask whether to commit them first, stash them or carry them over.
   - On another work branch with a handoff or commits not yet merged: stop and ask. Don't leave work half done.
   - A branch for this task already exists, local or remote (its key, number or name in the branch name): switch to it and resume from its handoff, as in the work-journal skill. Don't start over.
2. **Read the task**, if the name points to one (see the backlog skill, [Where the tasks are](../backlog/SKILL.md#where-the-tasks-are)): its title and done condition become the goal. If nothing matches, the name is just a name.
3. **Name the branch** `feature/<slug>`: lowercase, hyphens, up to about 40 characters. A Jira key or issue number goes first (`feature/PODCAST-42-csv-export`, `feature/42-csv-export`); a task file gives its file name (`feature/csv-export`), which links the two. If the repo's branches use another prefix (`feat/`), use it.
4. **Create it from the base:**
   - git flow (`git config --get gitflow.branch.develop` prints a branch): `git flow feature start <slug>`. The base is that development branch.
   - Otherwise: the base is the current branch if it is the development branch (`develop`, or the default branch if there is no `develop`); from anywhere else, ask. Then `git switch -c feature/<slug>`.
5. **Write the handoff** `.ai/handoff/<branch>.md` in the work-journal format, with `Base: <base>` in the header (`/finish` merges there). Goal and done condition from the task or the context; if neither gives one, write `?` and ask in the report, never invent it. Status empty; Next steps: the first concrete step; Pointers: the task.
6. **Journal entry:** `## HH:MM · tool/model · <branch> · start`, then `Did:` the branch, its base and the task.
7. **Commit** the handoff and the entry on the new branch (`start: <task or name>`), so the goal and the base travel with the branch.
8. **Tracker task:** propose, in one confirmation, assigning it to the user and, in Jira, moving it to In Progress. Run only after the user's yes.
   - Jira: `acli jira workitem assign --key <KEY> --assignee @me --yes`, then `acli jira workitem transition --key <KEY> --status "In Progress" --yes` (the status name follows the workflow). Never change its sprint.
   - GitLab: `glab issue update <id> --assignee <the user's handle>`. GitHub: `gh issue edit <id> --add-assignee @me`. They have no native in-progress status: the branch is the mark.
   - Already assigned to someone else: say so, and reassign only if the user says so.
   - A task file: add `Assignee:` only if the user asks.
9. **Report** in two or three lines: branch and base, goal, first step, and the tracker commands waiting for confirmation.
