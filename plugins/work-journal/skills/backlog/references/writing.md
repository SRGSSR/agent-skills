# Backlog: creating, editing, commenting, closing

Part of the [backlog skill](../SKILL.md): read when the user creates, edits, assigns, comments on or closes a task. Its rules hold here too, above all [Writes need confirmation](../SKILL.md#writes-need-confirmation) and [Not logged in](../SKILL.md#not-logged-in).

## Creating (`/backlog new`)

In the work-journal skill's [soft mode](../../work-journal/SKILL.md#soft-mode), a task for the user themselves that fits in the work of the current branch gets one question first: a reminder in the handoff instead? Create the task if they prefer it, and always when it is for someone else, can't be done before the branch finishes, or the branch is the development or default one.

1. **Draft** from the user's words and the conversation, in the task file shape: a title, `Why:`, `Done when:`, optionally `Links:`. Don't invent a reason or a done condition: if one is missing, ask for it in the same message as the draft, or leave a `?` and say so. No assignee unless the user names one; for someone other than the user, see [Tasks for someone else](#tasks-for-someone-else).
2. **Check for duplicates** in the open tasks (titles only); if one looks the same, say so and ask before creating another.
3. **Create:**
   - Folder: write `<folder>/<name>.md` in the folder the block names, `<name>` being the branch that will do it without its prefix (`csv-export`). Don't create a branch for it.
   - GitLab: `glab issue create --title "<title>" --description-file - --yes`, with the body on stdin (a heredoc), so quotes and line breaks survive. Add `--assignee <handle>` only if the user named one.
   - GitHub: `gh issue create --title "<title>" --body-file -`, same body on stdin.
   - Jira: `acli jira workitem create --project <KEY> --type Task --summary "<title>" --description "$(cat <<'EOF' ... EOF)" --json`. Use another type only if the user names one; if the project requires more fields, show the error and ask.
   - Another tracker: its connector.
   - A fixed filter in the `Tasks:` line goes on the new task too: a parent with `--parent` (`acli`, `gh`) or `--epic` (`glab`), a label with `--label`.
4. **Report** the file name, or the issue number or key and URL from the command output.

## Tasks for someone else

A task assigned to someone other than the user (see [What to show](../SKILL.md#what-to-show), step 2) is read by a person who was not in this conversation, and must tell them what is being handed to them. This applies when creating it with that assignee, when assigning or reassigning it to them, and when editing a task already assigned to them.

- **The body explains the work**, in plain words, before `Why:`: what to do and where (files, components, pages, URLs), what is already known or decided (constraints, what was tried, what is out of scope), and whom to ask (the user's handle). Then `Why:`, `Done when:` and `Links:` as usual. No shorthand from this session ("as discussed", "the bug above", "option B"): name things.
- **Take it from the conversation and the code.** What you can't find out, ask the user in the same message as the draft; never invent it.
- **Assigning an existing task** whose body would leave the assignee guessing: propose the fuller body in the same confirmation, as before → after. The user can decline; then assign only.

## Editing (`/backlog edit`)

1. **Find the task** as in [Closing](#closing-backlog-close) step 1, and read its current values.
2. **Show the change** as before → after, with the exact command, and run it only after the user confirms (see [Writes need confirmation](../SKILL.md#writes-need-confirmation)). Change only what the user asked for, except for the fuller body of [Tasks for someone else](#tasks-for-someone-else), proposed in the same confirmation. An assignee comes from [`.ai/team.md`](team.md#people-aiteammd).
3. **Edit:**
   - Jira: `acli jira workitem edit --key <KEY-12> --summary "<title>" --yes` (also `--description`, `--labels`, `--remove-labels`, `--type`); assignee: `acli jira workitem assign --key <KEY-12> --assignee <account ID> --yes`, or `--remove-assignee`. `acli` cannot change the priority: use the Atlassian connector if available, otherwise say it is done in Jira. Never the sprint (see [Jira sprints](../SKILL.md#jira-sprints)).
   - GitLab: `glab issue update <id>` with `--title`, `--description-file -` (body on stdin), `--label`, `--unlabel`, `--assignee`, `--unassign`, `--milestone`.
   - GitHub: `gh issue edit <id>` with `--title`, `--body-file -`, `--add-label`, `--remove-label`, `--add-assignee`, `--remove-assignee`, `--milestone`.
   - Folder: edit the file (title, `Why:`, `Done when:`, `Links:`, `Assignee:`, `Postponed:`); git keeps the old version.
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

