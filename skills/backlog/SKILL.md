---
name: backlog
description: Lists, creates, comments on and closes the project's tasks wherever the work-journal block in AGENTS.md says they live, a task folder (`docs/backlog/`, or an existing `docs/tasks/` or `docs/todo/`), GitLab issues (`glab`), GitHub issues (`gh`), Jira (`acli` or the Atlassian connector) or another tracker, and points to what to pick up next. Use this skill whenever the user types `/backlog`, `/backlog new`, `/backlog comment` or `/backlog close`, asks what to work on next, which tasks, issues or work items are open, what is assigned to them or to someone else, asks to see the task list or backlog, or asks to open, file, add, comment on, close or drop a task or issue.
license: MIT
metadata:
  version: "0.2.0"
---

# Backlog

Commands:

- `/backlog`: the open tasks and what to pick up next.
- `/backlog new <what>`: create a task. See [Creating](#creating-backlog-new).
- `/backlog comment <task> <text>`: add a comment to a task. See [Commenting](#commenting-backlog-comment).
- `/backlog close <task>`: close a task by file name, issue ID or Jira key. See [Closing](#closing-backlog-close).

The same requests in words ("open an issue for ...", "note on #42 that ...", "close #42") work the same way. Formats and lifecycle of task files and issues are in the [work-journal skill, Tasks](../work-journal/SKILL.md#tasks); this skill runs them.

Talk in the user's language.

## Where the tasks are

Read the `Tasks:` line of the work-journal block in `AGENTS.md`:

| Line names | List with |
|---|---|
| A folder (`docs/backlog/`, `docs/tasks/`, `docs/todo/`) | `grep -m1 -H '^# ' docs/backlog/*.md` (titles) and `grep -H '^Assignee:' docs/backlog/*.md`, with the folder the block names. Don't read the files whole. |
| A file (`ROADMAP.md`, `TODO.md`) | Its open items, in its own format |
| GitLab issues | `glab issue list -O json` (open issues; read number, title, assignees) |
| GitHub issues | `gh issue list --json number,title,assignees` |
| Jira | `acli jira workitem search --jql "project = <KEY> AND statusCategory != Done ORDER BY Rank" --fields "key,summary,assignee,status" --json`. If `acli` is missing, the Atlassian connector with the same JQL. |
| Another tracker | Its connector, open items of the named project |
| `none`, or no block | Say there is no task list; offer to choose one (work-journal setup step 3). Don't search the journal for follow-ups. |

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
2. **Then the open tasks, grouped:** assigned to the user, unassigned, assigned to others (count per handle only, unless the user asks for someone's tasks). The user is `@me` in GitLab and GitHub, the account of `acli jira auth status` in Jira, `git config user.name` for a folder.
3. One line per task: file name or issue ID, title, assignee, in-progress mark. No bodies.
4. End with one suggestion: the current branch's next step, else the first task assigned to the user, else the first unassigned one.

Listing only reads, so it needs no confirmation. Never assign or reassign a task while listing.

## Writes need confirmation

Creating, commenting on or closing an issue in a tracker writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the drafted issue, the comment text, or the issue to close with its title) and the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. Task files in the repo need no confirmation: git keeps them and the user reviews the diff.

If the CLI is not logged in, follow [Not logged in](#not-logged-in) first, then go on.

## Creating (`/backlog new`)

1. **Draft** from the user's words and the conversation, in the task file shape: a title, `Why:`, `Done when:`, optionally `Links:`. Don't invent a reason or a done condition: if one is missing, ask for it in the same message as the draft, or leave a `?` and say so. No assignee unless the user names one.
2. **Check for duplicates** in the open tasks (titles only); if one looks the same, say so and ask before creating another.
3. **Create:**
   - Folder: write `<folder>/<name>.md` in the folder the block names, `<name>` being the branch that will do it without its prefix (`csv-export`). Don't create a branch for it.
   - GitLab: `glab issue create --title "<title>" --description-file - --yes`, with the body on stdin (a heredoc), so quotes and line breaks survive. Add `--assignee <handle>` only if the user named one.
   - GitHub: `gh issue create --title "<title>" --body-file -`, same body on stdin.
   - Jira: `acli jira workitem create --project <KEY> --type Task --summary "<title>" --description "$(cat <<'EOF' ... EOF)" --json`. Use another type only if the user names one; if the project requires more fields, show the error and ask.
   - Another tracker: its connector.
4. **Report** the file name, or the issue number or key and URL from the command output.

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
   - GitLab: `glab issue close <id>`. GitHub: `gh issue close <id>`, adding `--reason "not planned"` for a dropped task.
   - Jira: `acli jira workitem transition --key <KEY-12> --status "Done" --yes`. Statuses depend on the project's workflow: for a dropped task use its status for that (Won't Do, Cancelled) if the user names one or the work item shows it; if the transition fails, show the error and ask for the status name.
   - Another tracker: its connector.
4. If the user gave a reason (duplicate of #12, no longer needed), post it as a comment before closing, in the same confirmation: GitLab `glab issue note <id> -m "<reason>"` then `glab issue close <id>`; GitHub `gh issue close <id> --comment "<reason>"`; Jira `acli jira workitem comment create` then `acli jira workitem transition`. For a folder task, the reason goes in the commit message that deletes the file.
