---
name: task
description: Lists the project's open tasks from wherever the work-journal block in AGENTS.md says they live, a task folder (`docs/tasks/`), GitLab issues (`glab`), GitHub issues (`gh`) or another tracker, and points to what to pick up next. Use this skill whenever the user types `/task`, asks what to work on next, which tasks or issues are open, what is assigned to them or to someone else, or asks to see the task list or backlog.
license: MIT
metadata:
  version: "0.1.0"
---

# Task

`/task` shows the open tasks of the project and what to pick up next. Rules for task files, issues and their lifecycle are in the [work-journal skill, Tasks](../work-journal/SKILL.md#tasks); this skill only reads them.

Talk in the user's language.

## Where the tasks are

Read the `Tasks:` line of the work-journal block in `AGENTS.md`:

| Line names | List with |
|---|---|
| A folder (`docs/tasks/`, `docs/todo/`) | `grep -m1 -H '^# ' docs/tasks/*.md` (titles) and `grep -H '^Assignee:' docs/tasks/*.md`. Don't read the files whole. |
| A file (`ROADMAP.md`, `TODO.md`) | Its open items, in its own format |
| GitLab issues | `glab issue list -O json` (open issues; read number, title, assignees) |
| GitHub issues | `gh issue list --json number,title,assignees` |
| Another tracker (Jira, ...) | Its connector, open items of the named project |
| `none`, or no block | Say there is no task list; offer to choose one (work-journal setup step 3). Don't search the journal for follow-ups. |

### Not logged in

If `glab` or `gh` is missing or not logged in for the host of `origin` (`glab auth status`, `gh auth status`):

1. **Say so and ask whether the user wants to log in now.** Login is interactive (browser or token prompt), so the user runs it, not you: in Claude Code with `! glab auth login --hostname <host>` (or `! gh auth login`), in other tools in a terminal. When they say it is done, check with `auth status` and list.
2. **If they don't want to, or you cannot ask** (non-interactive run), explain how to do it later, then stop:
   - install the CLI if missing (for example `brew install glab`, `brew install gh`);
   - run `glab auth login --hostname <host>` (`--hostname` can be left out for gitlab.com) or `gh auth login`;
   - choose browser login, or paste a personal access token into the CLI prompt (GitLab: scope `api`);
   - check with `glab auth status` / `gh auth status`, then `/task` again.

Never ask for a token in the chat or write it in a file. Never invent issues and never list `docs/tasks/` instead.

## What to show

1. **Work in progress first.** If the current branch has a handoff (`.ai/handoff/<branch>.md`), its next step comes before any new task. A task with a handoff on another branch is in progress there: mark it (`docs/tasks/csv-export.md` ↔ `.ai/handoff/feature-csv-export.md`; for an issue, a handoff that names its ID).
2. **Then the open tasks, grouped:** assigned to the user, unassigned, assigned to others (count per handle only, unless the user asks for someone's tasks). The user is `@me` in a tracker, `git config user.name` for a folder.
3. One line per task: file name or issue ID, title, assignee, in-progress mark. No bodies.
4. End with one suggestion: the current branch's next step, else the first task assigned to the user, else the first unassigned one.

Listing only reads, so it needs no confirmation. Never assign or reassign a task while listing.

## Other requests

Creating, closing, commenting on or assigning a task follows the work-journal Tasks rules: a task file only when the user asks or at the end of a branch's task; in a tracker, show the exact command and run it only after the user confirms it.
