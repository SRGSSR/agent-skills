---
name: backlog
description: Lists, creates and closes the project's tasks wherever the work-journal block in AGENTS.md says they live, a task folder (`docs/backlog/`, or an existing `docs/tasks/` or `docs/todo/`), GitLab issues (`glab`), GitHub issues (`gh`) or another tracker, and points to what to pick up next. Use this skill whenever the user types `/backlog`, `/backlog new` or `/backlog close`, asks what to work on next, which tasks or issues are open, what is assigned to them or to someone else, asks to see the task list or backlog, or asks to open, file, add, close or drop a task or issue.
license: MIT
metadata:
  version: "0.1.0"
---

# Backlog

Commands:

- `/backlog`: the open tasks and what to pick up next.
- `/backlog new <what>`: create a task. See [Creating](#creating-backlog-new).
- `/backlog close <task>`: close a task by file name or issue ID. See [Closing](#closing-backlog-close).

The same requests in words ("open an issue for ...", "close #42") work the same way. Formats and lifecycle of task files and issues are in the [work-journal skill, Tasks](../work-journal/SKILL.md#tasks); this skill runs them.

Talk in the user's language.

## Where the tasks are

Read the `Tasks:` line of the work-journal block in `AGENTS.md`:

| Line names | List with |
|---|---|
| A folder (`docs/backlog/`, `docs/tasks/`, `docs/todo/`) | `grep -m1 -H '^# ' docs/backlog/*.md` (titles) and `grep -H '^Assignee:' docs/backlog/*.md`, with the folder the block names. Don't read the files whole. |
| A file (`ROADMAP.md`, `TODO.md`) | Its open items, in its own format |
| GitLab issues | `glab issue list -O json` (open issues; read number, title, assignees) |
| GitHub issues | `gh issue list --json number,title,assignees` |
| Another tracker (Jira, ...) | Its connector, open items of the named project |
| `none`, or no block | Say there is no task list; offer to choose one (work-journal setup step 3). Don't search the journal for follow-ups. |

### Not logged in

If `glab` or `gh` is missing or not logged in for the host of `origin` (`glab auth status`, `gh auth status`):

1. **Say so and ask whether the user wants to log in now.** Login is interactive (browser or token prompt), so the user runs it, not you: in Claude Code with `! glab auth login --hostname <host>` (or `! gh auth login`), in other tools in a terminal. When they say it is done, check with `auth status` and go on with the command.
2. **If they don't want to, or you cannot ask** (non-interactive run), explain how to do it later, then stop:
   - install the CLI if missing (for example `brew install glab`, `brew install gh`);
   - run `glab auth login --hostname <host>` (`--hostname` can be left out for gitlab.com) or `gh auth login`;
   - choose browser login, or paste a personal access token into the CLI prompt (GitLab: scope `api`);
   - check with `glab auth status` / `gh auth status`, then run the command again.

Never ask for a token in the chat or write it in a file. Never invent issues and never list a task folder instead.

## What to show

1. **Work in progress first.** If the current branch has a handoff (`.ai/handoff/<branch>.md`), its next step comes before any new task. A task with a handoff on another branch is in progress there: mark it (`docs/backlog/csv-export.md` ↔ `.ai/handoff/feature-csv-export.md`; for an issue, a handoff that names its ID).
2. **Then the open tasks, grouped:** assigned to the user, unassigned, assigned to others (count per handle only, unless the user asks for someone's tasks). The user is `@me` in a tracker, `git config user.name` for a folder.
3. One line per task: file name or issue ID, title, assignee, in-progress mark. No bodies.
4. End with one suggestion: the current branch's next step, else the first task assigned to the user, else the first unassigned one.

Listing only reads, so it needs no confirmation. Never assign or reassign a task while listing.

## Writes need confirmation

Creating or closing an issue in a tracker writes outside the repo. Even when the user typed the command, show what will happen (the drafted issue, or the issue to close with its title) and the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. Task files in the repo need no confirmation: git keeps them and the user reviews the diff.

If the CLI is not logged in, follow [Not logged in](#not-logged-in) first, then go on.

## Creating (`/backlog new`)

1. **Draft** from the user's words and the conversation, in the task file shape: a title, `Why:`, `Done when:`, optionally `Links:`. Don't invent a reason or a done condition: if one is missing, ask for it in the same message as the draft, or leave a `?` and say so. No assignee unless the user names one.
2. **Check for duplicates** in the open tasks (titles only); if one looks the same, say so and ask before creating another.
3. **Create:**
   - Folder: write `<folder>/<name>.md` in the folder the block names, `<name>` being the branch that will do it without its prefix (`csv-export`). Don't create a branch for it.
   - GitLab: `glab issue create --title "<title>" --description-file - --yes`, with the body on stdin (a heredoc), so quotes and line breaks survive. Add `--assignee <handle>` only if the user named one.
   - GitHub: `gh issue create --title "<title>" --body-file -`, same body on stdin.
   - Another tracker: its connector.
4. **Report** the file name, or the issue number and URL from the command output.

## Closing (`/backlog close`)

A task normally closes with the branch that does it: the branch deletes the task file, or its merge request says `Closes #42`. `/backlog close` is for the rest: done elsewhere, dropped, duplicated.

1. **Find it** by file name, issue ID or title. If more than one task matches, list them and ask.
2. **Warn** if the work looks in progress (a handoff or branch names it), or if it is assigned to someone other than the user. Ask before going on.
3. **Close:**
   - Folder: delete the file. Say that the deletion closes the task for everyone when it reaches the shared branch.
   - GitLab: `glab issue close <id>`. GitHub: `gh issue close <id>`, adding `--reason "not planned"` for a dropped task.
   - Another tracker: its connector.
4. If the user gave a reason (duplicate of #12, no longer needed), say it in the confirmation message. Commenting on issues is not part of this skill yet: suggest adding the reason in the tracker by hand.
