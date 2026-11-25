---
name: backlog
description: "Lists, creates, edits, comments on and closes the project's tasks wherever the work-journal block in AGENTS.md says they live, a task folder (`docs/backlog/`, or an existing `docs/tasks/` or `docs/todo/`), GitLab issues (`glab`), GitHub issues (`gh`), Jira (`acli` or the Atlassian connector) or another tracker, and points to what to pick up next. Use this skill whenever the user types `/backlog`, `/backlog new`, `edit`, `comment`, `close`, `filter` or `help`, asks what to work on next, which tasks, issues or work items are open (also only those of a parent, epic, label or sprint), what is assigned to them or to someone else, asks to see the task list or backlog, or asks to open, file, add, edit, assign, comment on, close or drop a task or issue, also naming a person by first name or nickname, or asks to create or update the team file `.ai/team.md` (it holds personal data: warn and wait for a yes before looking anyone up, even in `git log`)."
license: MIT
argument-hint: "[new | edit | comment | close | filter | help] ..."
metadata:
  version: "0.12.1"
---

# Backlog

Commands:

- `/backlog`: the open tasks and what to pick up next.
- `/backlog new <what>`: create a task. See [Creating](references/writing.md#creating-backlog-new).
- `/backlog edit <task> <change>`: change a task's title, description, labels, type or assignee. See [Editing](references/writing.md#editing-backlog-edit).
- `/backlog comment <task> <text>`: add a comment to a task. See [Commenting](references/writing.md#commenting-backlog-comment).
- `/backlog close <task>`: close a task by file name, issue ID or Jira key. See [Closing](references/writing.md#closing-backlog-close).
- `/backlog filter <condition>`: the open tasks that match a condition (parent, epic, label, milestone, sprint, assignee, text, or JQL). See [Filtering](#filtering-backlog-filter).
- `/backlog help`: this list of commands, with where the tasks are and the filter in use. Read only the block; run nothing else.

The same requests in words ("open an issue for ...", "assign #42 to Simo", "note on #42 that ...", "close #42") work the same way. People named in a request are looked up in [`.ai/team.md`](references/team.md#people-aiteammd); creating that file starts with a personal-data warning, before any lookup. Formats and lifecycle of task files and issues are in the [work-journal skill, Tasks](../work-journal/SKILL.md#tasks); this skill runs them.

This file covers listing and filtering. Read the reference files only when the request needs them, and before acting on it:

- [`references/writing.md`](references/writing.md): `new`, `edit`, `comment`, `close`, assigning a task, and the same in words.
- [`references/team.md`](references/team.md): a request that names a person, or asks to create or update `.ai/team.md`.

Talk in the user's language.

## Where the tasks are

Read the `Tasks:` line of the work-journal block in `AGENTS.md`:

| Line names | List with |
|---|---|
| A folder (`docs/backlog/`, `docs/tasks/`, `docs/todo/`) | `grep -m1 -H '^# ' docs/backlog/*.md` (titles) and `grep -H -e '^Assignee:' -e '^Postponed:' docs/backlog/*.md`, with the folder the block names. Don't read the files whole. Creation order, oldest first: `git log --diff-filter=A --format= --name-only --reverse -- docs/backlog/` (skip files no longer there; files not yet committed come last). |
| A file (`ROADMAP.md`, `TODO.md`) | Its open items, in its own format |
| GitLab issues | `glab issue list`, below: open issues, oldest first, one line each with number, title, assignees, labels, milestone |
| GitHub issues | `gh issue list`, below: the same, oldest first |
| Jira | Two searches, the current sprint and the rest: `acli jira workitem search --jql "project = <KEY> AND statusCategory != Done AND sprint in openSprints() ORDER BY priority DESC, Rank" --fields "key,summary,assignee,status,priority,labels" --limit 100 --json`, then the same with `AND (sprint is EMPTY OR sprint not in openSprints())`. A project without sprints (Kanban) gives an error or nothing for the first: use only the second, without the sprint condition. If `acli` is missing, the Atlassian connector with the same JQL. |
| Another tracker | Its connector, open items of the named project |
| `none`, or no block | Say there is no task list; offer to choose one (work-journal setup step 3). Don't search the journal for follow-ups. |

The GitLab and GitHub listings, with a filter that keeps only those fields (the full JSON of 100 issues, descriptions included, can take more than 100k tokens):

```sh
glab issue list --order created_at --sort asc -P 100 -O json --jq '(["iid","title","assignees","labels","milestone"] | @tsv), (.[] | [.iid, .title, ([.assignees[].username] | join(",")), (.labels | join(",")), (.milestone.title // "")] | @tsv)'
gh issue list --search "sort:created-asc" --limit 100 --json number,title,assignees,labels,milestone --jq '(["number","title","assignees","labels","milestone"] | @tsv), (.[] | [.number, .title, ([.assignees[].login] | join(",")), ([.labels[].name] | join(",")), (.milestone.title // "")] | @tsv)'
```

A `glab` too old for `--jq`: the same command without `-O json --jq ...` (a text list), and again with `--assignee=@me` for the user's issues. Never read the full JSON.

A tracker listing fetches at most 100: if it returns exactly that many (after the header line), say there may be more and suggest `/backlog filter`.

The line can add a fixed filter after the project, for a repo that works on part of a shared tracker: `Jira PODCAST, parent = PODCAST-10`, `GitLab issues of team/podcast, label backend`. Apply it to every listing, on top of any `/backlog filter`, and give new tasks the same parent or label. Say it in the first line of the listing ("PODCAST, parent = PODCAST-10:").

### Not logged in

For Jira, if `acli` is missing but the Atlassian connector is available, use the connector without asking. Otherwise, if `glab`, `gh` or `acli` is missing or not logged in (`glab auth status` for the host of `origin`, `gh auth status`, `acli jira auth status` for the site the block names):

1. **Say so and ask whether the user wants to log in now.** Login is interactive (browser or token prompt), so the user runs it, not you: in Claude Code with `! glab auth login --hostname <host>` (or `! gh auth login`, `! acli jira auth login --web`), in other tools in a terminal. When they say it is done, check with `auth status` and go on with the command.
2. **If they don't want to, or you cannot ask** (non-interactive run), explain how to do it later, then stop:
   - install the CLI if missing (for example `brew install glab`, `brew install gh`, `brew tap atlassian/homebrew-acli && brew install acli`);
   - run `glab auth login --hostname <host>` (`--hostname` can be left out for gitlab.com), `gh auth login` or `acli jira auth login --web`;
   - choose browser login, or give a personal access token to the CLI (GitLab: scope `api`; Jira: an API token from id.atlassian.com, piped into `acli jira auth login --site <site> --email <email> --token`);
   - check with `glab auth status` / `gh auth status` / `acli jira auth status`, then run the command again.

Never ask for a token in the chat or write it in a file. Never invent issues and never list a task folder instead.

## What to show

1. **Work in progress first.** If the current branch has a handoff (`.ai/handoff/<branch>.md`), its next step comes before any new task. A task with a handoff on another branch is in progress there: mark it (`docs/backlog/csv-export.md` ↔ `.ai/handoff/feature-csv-export.md`; for an issue, a handoff or branch that names its ID; in Jira, also status category In Progress).
2. **Then the open tasks, grouped:** assigned to the user, unassigned, assigned to others (count per handle only, unless the user asks for someone's tasks). In Jira, the current sprint comes first with these three groups, then the backlog with the same three; within a group, the order the user asked for (priority, due date, ...), else higher priority first; ties go by Rank in Jira, by creation date, oldest first, in GitLab, GitHub and a folder. The user is the account of `glab api user --jq .username` in GitLab and `gh api user --jq .login` in GitHub, the account of `acli jira auth status` in Jira, `git config user.name` for a folder (or the row of `.ai/team.md` with that git name).
3. **A table per section** (one, or in Jira the current sprint and the backlog), one row per task, yours first, then unassigned: task (file name or issue ID), title, assignee (its handle in `.ai/team.md` if there; leave out the column when every row is assigned to the user, as in "what is assigned to me?": it would repeat their own name), priority if the tracker has one (leave out the column if every task has the default), status (in progress, [postponed](#postponed-tasks), else empty). No bodies. The count of others' tasks goes in one line under the table. Any other list of tasks (matches to choose from, duplicates) is a table with the same columns.
4. End with one suggestion: the current branch's next step, else the first task assigned to the user (in Jira, in the current sprint first), else the first unassigned one, skipping postponed tasks whose date has not passed or is not known. For a new task, add how to begin it: `/start <ID or file name>`.
5. Last line: the other commands, `new`, `edit`, `comment`, `close`, `filter`, `help`, in one line.

Listing only reads, so it needs no confirmation. Never assign or reassign a task while listing.

### Postponed tasks

A task is postponed when something says so: a label, status or milestone meaning it (Postponed, On hold, Deferred, Later, and the same in the team's language), or a `Postponed:` line in a task file. Only for these, look for the date it can resume, and stop at the first found:

1. **A field for it:** the `Postponed:` line; in Jira a date field whose name says so (Postponed until, Resume date, On hold until), from `acli jira workitem view <KEY> --fields '*all' --json`. A due date is a deadline, not a resume date: don't use it.
2. **The description**, then **the comments**, newest first: a sentence that gives the date ("postponed to March", "on hold until the new API is live"). GitLab `glab issue view <id> --comments`, GitHub `gh issue view <id> --json body,comments`, Jira `acli jira workitem view <KEY> --json` and `acli jira workitem comment list --key <KEY> --order -created --json`; a task file's `## Notes`.

In the status column: `postponed until 2027-01-15`, a date written loosely kept as written (`postponed until after the summer`), `postponed, no date`, or `postponed until 2027-01-15 (passed)` once the date is behind today. A postponed task is not suggested until its date has passed; with no date, or one you can't place in time, never. Changing nothing: the label, status or line stay as they are.

## Filtering (`/backlog filter`)

Translate the condition into the tracker's own filter, so the tracker does the work, then show the result as in [What to show](#what-to-show), with the filter in its first line. If no task matches, say so and show the query you ran.

- Jira: add it to the JQL with `AND`: `parent = PODCAST-10`, `labels = backend`, `sprint in openSprints()`, `assignee = currentUser()`. A condition the user writes as JQL (`jql: ...`) goes in as it is.
- GitLab: the `glab issue list` flags: `--epic <id> --group <group>`, `--label`, `--milestone`, `--assignee`, `--search`.
- GitHub: the `gh issue list` flags: `--label`, `--milestone`, `--assignee`, `--type`, `--search` with GitHub search syntax (keep `sort:created-asc` in it). There is no flag for sub-issues of a parent: try it in `--search`, and if the query fails, say so.
- Folder: match titles, `Assignee:` and `Links:` lines with `grep`.
- A person ("Simo's tasks"): their handle for that tracker from [`.ai/team.md`](references/team.md#people-aiteammd).

If the tracker cannot express the condition, say so and offer the nearest filter it has; don't list everything and filter by guess. A `/backlog filter` lasts for that listing only; for one that should always apply, offer to add it to the `Tasks:` line.

## Writes need confirmation

Creating, editing, commenting on or closing an issue in a tracker writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the drafted issue, the change as before → after, the comment text, or the issue to close with its title) and the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. Task files in the repo need no confirmation: git keeps them and the user reviews the diff.

If the CLI is not logged in, follow [Not logged in](#not-logged-in) first, then go on.

### Jira sprints

Sprint planning belongs to the team in Jira, not to the agent:

- New work items go to the backlog: never set a sprint when creating one. If the user asks to put it in a sprint, create it in the backlog and say that sprints are planned in Jira.
- A work item in a sprint can be edited, commented on and closed, with the same confirmation as any write.
- Never move a work item into a sprint, to another sprint or back to the backlog, and never delete or archive one (`acli jira workitem delete`, `archive`). If the user asks, say it is done in Jira.

