# Backlog: people (`.ai/team.md`)

Part of the [backlog skill](../SKILL.md): read when a request names a person, or the user asks to create or update `.ai/team.md`.

## People (`.ai/team.md`)

The same person often has a different handle in git, GitLab, GitHub and Jira, and people name each other by first name ("assign it to Simo"). `.ai/team.md`, when the project has one, maps them, one row per person:

```markdown
# Team

| Handle   | Git              | GitLab   | GitHub        | Jira           | Roles       | Aliases             |
|----------|------------------|----------|---------------|----------------|-------------|---------------------|
| monacosi | Simone Monaco    | monacosi | simone-monaco | 712020:3f1c... | backend, PO | Simone, Simo, Simon |
| rossial  | Alessandro Rossi |          |               | 712020:9a2b... |             | Alessandro          |
```

- **Handle** is the name used in task files (`Assignee:`) and in listings. The other columns hold the handle on each system; leave a cell empty if the person is not there. Jira takes the account ID, not the email. **Roles** is free text (`backend`, `frontend`, `QA`, `PO`), filled in by the team; empty until then. Only handles, account IDs, display names, roles and aliases: no emails, phone numbers or other personal data.
- **Aligned:** pad every cell with spaces to the widest cell of its column, so the pipes line up and the table reads in plain text too. Keep it aligned when you add or change a row.
- **Lookup:** when a request names a person, read the file if there is one and match the name against Handle, the system columns and Aliases, ignoring case. One match: use that row's handle for the system in use. More than one: list them and ask. A match with an empty cell for the system in use counts as none.
- **None:** look the person up in the tracker (GitLab `glab api "projects/:id/members/all?query=<name>"`, GitHub `gh api "repos/{owner}/{repo}/collaborators" --jq '.[].login'`, Jira the assignee of a work item they have, `acli jira workitem view <KEY> --json`, or the Atlassian connector's user lookup) and ask who it is if it is not clear; don't guess between similar names. If the file exists, propose the row with what you found and add it when the user confirms. If there is no file, use what you found for this request only: don't propose creating it.
- **Suggesting an assignee:** when a new task has no assignee, or the user asks who could take one, suggest the people whose Roles match the task's area, with how many open tasks each already has. Only suggest: assign when the user asks, and in a tracker after their confirmation. Without the file, don't suggest anyone.
- **Created only when the user asks for it** ("create the team file", "map the team in `.ai/team.md`"). Never propose it on your own: not at setup, not when a name is missing, not because the project has several authors or a tracker.
  1. **Warn first, before any search:** the file links each person's name, nicknames, roles and accounts on git, GitLab, GitHub and Jira, which is personal data. Ask whether to continue, and stop until the user answers. Until then, look up no one: no `git log` of authors, no tracker members, not even for a preview, and name no one in the warning. If not, write nothing and run no search.
  2. **Collect:** `git log --since=12.months --format='%aN' | sort -u` (names only, never emails); GitLab `glab api "projects/:id/members/all"` (username, name); GitHub `gh api "repos/{owner}/{repo}/collaborators" --jq '.[].login'` and each login's name (`gh api users/<login> --jq .name`); Jira the assignees of the project's work items (account ID, display name). Match people across systems by name; mark uncertain matches with `?` and list them, never guess. Handle: the tracker username (else the GitLab or GitHub one, else the git name in lowercase with hyphens); Aliases: the first name; Roles: empty. Skip bots (`[bot]`, `dependabot`, `gitlab-bot`, `renovate`).
  3. **Show the table and ask where it goes:** committed, shared with everyone who has access to the repo (who already sees these names in `git log` and the tracker), or ignored by git (add `.ai/team.md` to `.gitignore`), each person keeping their own. In a public repo, recommend ignoring it: committed, it would put accounts, nicknames and roles online. Visibility: `gh repo view --json visibility` or `glab repo view` (shows public); if you can't tell, say so. Write the file, and `.gitignore` if chosen, after the user's answer.
- **Changed** when the user asks, or a row added as in None above. The user can edit it by hand.
