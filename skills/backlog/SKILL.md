---
name: backlog
description: Lists, creates, edits, comments on and closes the project's tasks wherever the work-journal block in AGENTS.md says they live, a task folder (`docs/backlog/`, or an existing `docs/tasks/` or `docs/todo/`), GitLab issues (`glab`), GitHub issues (`gh`), Jira (`acli` or the Atlassian connector) or another tracker, and points to what to pick up next. Use this skill whenever the user types `/backlog`, `/backlog new`, `edit`, `comment`, `close`, `filter` or `help`, asks what to work on next, which tasks, issues or work items are open (also only those of a parent, epic, label or sprint), what is assigned to them or to someone else, asks to see the task list or backlog, or asks to open, file, add, edit, assign, comment on, close or drop a task or issue, also naming a person by first name or nickname.
license: MIT
argument-hint: "[new | edit | comment | close | filter | help] ..."
metadata:
  version: "0.5.0"
---

# Backlog

Commands:

- `/backlog`: the open tasks and what to pick up next.
- `/backlog new <what>`: create a task. See [Creating](#creating-backlog-new).
- `/backlog edit <task> <change>`: change a task's title, description, labels, type or assignee. See [Editing](#editing-backlog-edit).
- `/backlog comment <task> <text>`: add a comment to a task. See [Commenting](#commenting-backlog-comment).
- `/backlog close <task>`: close a task by file name, issue ID or Jira key. See [Closing](#closing-backlog-close).
- `/backlog filter <condition>`: the open tasks that match a condition (parent, epic, label, milestone, sprint, assignee, text, or JQL). See [Filtering](#filtering-backlog-filter).
- `/backlog help`: this list of commands, with where the tasks are and the filter in use. Read only the block; run nothing else.

The same requests in words ("open an issue for ...", "assign #42 to Simo", "note on #42 that ...", "close #42") work the same way. People named in a request are looked up in [`.ai/team.md`](#people-aiteammd). Formats and lifecycle of task files and issues are in the [work-journal skill, Tasks](../work-journal/SKILL.md#tasks); this skill runs them.

Talk in the user's language.

## Where the tasks are

Read the `Tasks:` line of the work-journal block in `AGENTS.md`:

| Line names | List with |
|---|---|
| A folder (`docs/backlog/`, `docs/tasks/`, `docs/todo/`) | `grep -m1 -H '^# ' docs/backlog/*.md` (titles) and `grep -H '^Assignee:' docs/backlog/*.md`, with the folder the block names. Don't read the files whole. |
| A file (`ROADMAP.md`, `TODO.md`) | Its open items, in its own format |
| GitLab issues | `glab issue list -O json -P 100` (open issues; read number, title, assignees) |
| GitHub issues | `gh issue list --json number,title,assignees --limit 100` |
| Jira | Two searches, the current sprint and the rest: `acli jira workitem search --jql "project = <KEY> AND statusCategory != Done AND sprint in openSprints() ORDER BY priority DESC, Rank" --fields "key,summary,assignee,status,priority" --limit 100 --json`, then the same with `AND (sprint is EMPTY OR sprint not in openSprints())`. A project without sprints (Kanban) gives an error or nothing for the first: use only the second, without the sprint condition. If `acli` is missing, the Atlassian connector with the same JQL. |
| Another tracker | Its connector, open items of the named project |
| `none`, or no block | Say there is no task list; offer to choose one (work-journal setup step 3). Don't search the journal for follow-ups. |

A tracker listing fetches at most 100: if it returns exactly that many, say there may be more and suggest `/backlog filter`.

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
2. **Then the open tasks, grouped:** assigned to the user, unassigned, assigned to others (count per handle only, unless the user asks for someone's tasks). In Jira, the current sprint comes first with these three groups, then the backlog with the same three; within a group, higher priority first, then the tracker's order. The user is `@me` in GitLab and GitHub, the account of `acli jira auth status` in Jira, `git config user.name` for a folder (or the row of `.ai/team.md` with that git name).
3. One line per task: file name or issue ID, title, assignee (its handle in `.ai/team.md` if there), priority if the tracker has one and it is not the default, in-progress mark. No bodies.
4. End with one suggestion: the current branch's next step, else the first task assigned to the user (in Jira, in the current sprint first), else the first unassigned one.
5. Last line: the other commands, `new`, `edit`, `comment`, `close`, `filter`, `help`, in one line.

Listing only reads, so it needs no confirmation. Never assign or reassign a task while listing.

## Filtering (`/backlog filter`)

Translate the condition into the tracker's own filter, so the tracker does the work, then show the result as in [What to show](#what-to-show), with the filter in its first line. If no task matches, say so and show the query you ran.

- Jira: add it to the JQL with `AND`: `parent = PODCAST-10`, `labels = backend`, `sprint in openSprints()`, `assignee = currentUser()`. A condition the user writes as JQL (`jql: ...`) goes in as it is.
- GitLab: the `glab issue list` flags: `--epic <id> --group <group>`, `--label`, `--milestone`, `--assignee`, `--search`.
- GitHub: the `gh issue list` flags: `--label`, `--milestone`, `--assignee`, `--type`, `--search` with GitHub search syntax. There is no flag for sub-issues of a parent: try it in `--search`, and if the query fails, say so.
- Folder: match titles, `Assignee:` and `Links:` lines with `grep`.
- A person ("Simo's tasks"): their handle for that tracker from [`.ai/team.md`](#people-aiteammd).

If the tracker cannot express the condition, say so and offer the nearest filter it has; don't list everything and filter by guess. A `/backlog filter` lasts for that listing only; for one that should always apply, offer to add it to the `Tasks:` line.

## Writes need confirmation

Creating, editing, commenting on or closing an issue in a tracker writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the drafted issue, the change as before → after, the comment text, or the issue to close with its title) and the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. Task files in the repo need no confirmation: git keeps them and the user reviews the diff.

If the CLI is not logged in, follow [Not logged in](#not-logged-in) first, then go on.

### Jira sprints

Sprint planning belongs to the team in Jira, not to the agent:

- New work items go to the backlog: never set a sprint when creating one. If the user asks to put it in a sprint, create it in the backlog and say that sprints are planned in Jira.
- A work item in a sprint can be edited, commented on and closed, with the same confirmation as any write.
- Never move a work item into a sprint, to another sprint or back to the backlog, and never delete or archive one (`acli jira workitem delete`, `archive`). If the user asks, say it is done in Jira.

## Creating (`/backlog new`)

1. **Draft** from the user's words and the conversation, in the task file shape: a title, `Why:`, `Done when:`, optionally `Links:`. Don't invent a reason or a done condition: if one is missing, ask for it in the same message as the draft, or leave a `?` and say so. No assignee unless the user names one.
2. **Check for duplicates** in the open tasks (titles only); if one looks the same, say so and ask before creating another.
3. **Create:**
   - Folder: write `<folder>/<name>.md` in the folder the block names, `<name>` being the branch that will do it without its prefix (`csv-export`). Don't create a branch for it.
   - GitLab: `glab issue create --title "<title>" --description-file - --yes`, with the body on stdin (a heredoc), so quotes and line breaks survive. Add `--assignee <handle>` only if the user named one.
   - GitHub: `gh issue create --title "<title>" --body-file -`, same body on stdin.
   - Jira: `acli jira workitem create --project <KEY> --type Task --summary "<title>" --description "$(cat <<'EOF' ... EOF)" --json`. Use another type only if the user names one; if the project requires more fields, show the error and ask.
   - Another tracker: its connector.
   - A fixed filter in the `Tasks:` line goes on the new task too: a parent with `--parent` (`acli`, `gh`) or `--epic` (`glab`), a label with `--label`.
4. **Report** the file name, or the issue number or key and URL from the command output.

## Editing (`/backlog edit`)

1. **Find the task** as in [Closing](#closing-backlog-close) step 1, and read its current values.
2. **Show the change** as before → after, with the exact command, and run it only after the user confirms (see [Writes need confirmation](#writes-need-confirmation)). Change only what the user asked for. An assignee comes from [`.ai/team.md`](#people-aiteammd).
3. **Edit:**
   - Jira: `acli jira workitem edit --key <KEY-12> --summary "<title>" --yes` (also `--description`, `--labels`, `--remove-labels`, `--type`); assignee: `acli jira workitem assign --key <KEY-12> --assignee <account ID> --yes`, or `--remove-assignee`. `acli` cannot change the priority: use the Atlassian connector if available, otherwise say it is done in Jira. Never the sprint (see [Jira sprints](#jira-sprints)).
   - GitLab: `glab issue update <id>` with `--title`, `--description-file -` (body on stdin), `--label`, `--unlabel`, `--assignee`, `--unassign`, `--milestone`.
   - GitHub: `gh issue edit <id>` with `--title`, `--body-file -`, `--add-label`, `--remove-label`, `--add-assignee`, `--remove-assignee`, `--milestone`.
   - Folder: edit the file (title, `Why:`, `Done when:`, `Links:`, `Assignee:`); git keeps the old version.
   - Another tracker: its connector.
4. **Report** what changed, with the URL or file.

## Commenting (`/backlog comment`)

1. **Find the task** as in [Closing](#closing-backlog-close) step 1.
2. **Write the comment** from the user's words: keep their meaning, fix only typos, add nothing they did not say. If the user asked you to write it ("tell them the API is ready"), draft it and show it. Point to commits, files or merge requests instead of pasting diffs or logs; never put secrets, tokens or personal data in a comment.
3. **Post:**
   - GitLab: `glab issue note <id> -m "<text>"`; for more than one line, pass the text through a quoted heredoc (`-m "$(cat <<'EOF' ... EOF)"`).
   - GitHub: `gh issue comment <id> --body-file -`, with the text on stdin.
   - Jira: `acli jira workitem comment create --key <KEY-12> --body "<text>"`, multi-line text through a quoted heredoc as for GitLab.
   - Folder: append a dated line, `- YYYY-MM-DD: <text>`, under a `## Notes` heading at the end of the task file (add the heading if missing).
   - Another tracker: its connector.
4. **Report** the comment URL from the command output (for Jira, the work item URL), or the file changed.

## Closing (`/backlog close`)

A task normally closes with the branch that does it: the branch deletes the task file, or its merge request says `Closes #42`, or for Jira it is moved to Done after the merge. `/backlog close` is for the rest: done elsewhere, dropped, duplicated.

1. **Find it** by file name, issue ID or title. If more than one task matches, list them and ask.
2. **Warn** if the work looks in progress (a handoff or branch names it), or if it is assigned to someone other than the user. Ask before going on.
3. **Close:**
   - Folder: delete the file. Say that the deletion closes the task for everyone when it reaches the shared branch.
   - GitLab: `glab issue close <id>`. GitHub: `gh issue close <id>`, adding `--reason "not planned"` for a dropped task, or `--duplicate-of <number>` for a duplicate.
   - Jira: `acli jira workitem transition --key <KEY-12> --status "Done" --yes`. Statuses depend on the project's workflow: for a dropped task use its status for that (Won't Do, Cancelled) if the user names one or the work item shows it; if the transition fails, show the error and ask for the status name.
   - Another tracker: its connector.
4. If the user gave a reason (duplicate of #12, no longer needed), post it as a comment before closing, in the same confirmation: GitLab `glab issue note <id> -m "<reason>"` then `glab issue close <id>`; GitHub `gh issue close <id> --comment "<reason>"`; Jira `acli jira workitem comment create` then `acli jira workitem transition`. For a folder task, the reason goes in the commit message that deletes the file.

## People (`.ai/team.md`)

The same person often has a different handle in git, GitLab, GitHub and Jira, and people name each other by first name ("assign it to Simo"). `.ai/team.md` maps them, one row per person, for this project only:

```markdown
# Team

| Handle | Git | GitLab | GitHub | Jira | Aliases |
|---|---|---|---|---|---|
| monacosi | Simone Monaco | monacosi | simone-monaco | 712020:3f1c... | Simone, Simo, Simon |
```

- **Handle** is the name used in task files (`Assignee:`) and in listings. The other columns hold the handle on each system; leave a cell empty if the person is not there. Jira takes the account ID, not the email.
- **Lookup:** when a request names a person, read the file and match the name against Handle, the system columns and Aliases, ignoring case. One match: use that row's handle for the system in use. More than one: list them and ask. A match with an empty cell for the system in use counts as none.
- **None:** look the person up in the tracker (GitLab `glab api "projects/:id/members/all?query=<name>"`, GitHub `gh api "repos/{owner}/{repo}/collaborators" --jq '.[].login'`, Jira the assignee of a work item they have, `acli jira workitem view <KEY> --json`, or the Atlassian connector's user lookup), propose the row with what you found, and ask who it is. Add or complete the row when the user confirms; don't guess between similar names.
- **Private and per project:** the file is ignored by git, because handles and account IDs of colleagues are not for the repo history. When you create it, add `.ai/team.md` to `.gitignore` unless it is there. Only handles, account IDs, display names and aliases: no emails, phone numbers or other personal data.
- Create it on first need, not at setup. The user can edit it by hand.
