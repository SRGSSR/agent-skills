# Teams and long-lived projects

How the skills behave when several people and agents work on the same repo, on different branches, over months or years.

## What lives where

| Place | Content | Shared how |
|---|---|---|
| `AGENTS.md` blocks | Phase contract and journal protocol | Committed; loaded by every agent on every task |
| `.ai/phase.md` | Phase, overrides, custom rules, history | Committed |
| `.ai/debt.md` | Open and accepted tech debt | Committed; `merge=union` |
| `.ai/journal/YYYY-MM-DD.md` | What was done, decided, abandoned | Committed (or ignored, if the team prefers); `merge=union` |
| `.ai/handoff/<branch>.md` | State of one branch | Committed; one file per branch |
| Design decisions (for example `docs/design/`) | Why things are the way they are | Committed, written for people |
| Tasks (`docs/backlog/` or a tracker) | Open work and open questions | Committed, or in the tracker |
| `.ai/team.md` | Each person's handle on git, GitLab, GitHub and Jira, roles and nicknames | Only if you ask for it; committed or ignored by git, your choice |

`.ai/` is the agents' working state; design decisions and tasks are for people. The agents' private memory is not used for project state, because other agents and people can't read it.

## Branches

Each branch has its own handoff (`feature/csv-export` → `.ai/handoff/feature-csv-export.md`), so people on different branches never overwrite each other's state. When the branch's task is done, its handoff is deleted.

### Starting and finishing a branch

> /start PODCAST-42 export the item list as CSV

The agent checks that nothing is left uncommitted or half done, reads the task, and opens `feature/PODCAST-42-csv-export`: with `git flow feature start` if the repo uses git flow, otherwise from the development branch. It writes the handoff with the task's goal and `Base: develop` (where the branch started), adds a journal entry, commits both on the new branch, and offers to assign the task to you and move it to In Progress (Jira), after your yes. If a branch for the task already exists, it resumes it instead. Asked in words ("let's start on PODCAST-42"), it proposes `/start` and waits.

> /finish merge

The agent checks everything first: no stray uncommitted changes, build and tests green, nothing open in the handoff, docs complete for what the branch changed (each new command, option or behavior described where users look, with an example wherever similar things have one, nothing describing the old behavior), decisions and dead ends moved, follow-ups filed as tasks. If anything is missing it stops, lists it and asks. Otherwise it closes the task, deletes the handoff, writes the journal entry, commits, and integrates the way you named:

| Mode | What happens |
|---|---|
| `/finish merge` | git flow: `git flow feature finish`. Otherwise a merge into the `Base:` branch and the local branch deleted; if the base is `main`, it asks once first. A tracker task is closed after your yes, since a local merge doesn't trigger `Closes #42`. |
| `/finish mr`, `/finish merge-request` | A GitLab merge request into the base, with title, description and `Closes #42` (or the Jira key) |
| `/finish pr`, `/finish pull-request` | The same as a GitHub pull request |

If a check fails, nothing is committed or merged, for example:

```markdown
/finish merge stopped: one problem.
- docs/usage.md shows a command line for npm start and npm test, but not for the new
  `node bin/export.js > items.csv`. Add it there and in docs/csv-export.md?
Everything else is ready: tests 2/2, handoff closed, decisions in docs/csv-export.md.
```

For `/finish pr` the agent prepares the title and body from the task and the handoff:

```markdown
PODCAST-42 CSV export

Users download the item list as CSV, and it opens in Excel (de-CH).
- `toCsv(items)` in export.js: `;` separator and UTF-8 BOM
- "Download CSV" link on the list page
How to verify: `npm test`, then open the list page and click the link.

PODCAST-42
```

Anything after the mode is instructions for this run: options of the request, a title, a problem you accept.

> /finish pr as a draft, reviewer anna, the flaky upload test is known

The agent still runs every check: it reports the flaky test as accepted instead of stopping, and adds `--draft --reviewer anna` to `gh pr create`. Instructions never make it push or force.

The mode is required: `/finish` alone shows the syntax, `/finish help` the modes with the base the branch would go into and what gets checked. Nothing is pushed: for a merge or pull request, the agent gives you `git push -u origin <branch>`, then creates the request after your yes. The cleanup commit is part of the request, so merging it completes the work. `hotfix/` and `release/` branches are left to you, because finishing them is a release.

`ls .ai/handoff/` is the list of work in progress. An agent that starts on a branch without a handoff sees the others, mentions them only if relevant, and doesn't resume them unless you ask.

The journal and the debt list are shared by all branches. Setup adds `merge=union` for them to `.gitattributes`, so when two branches append on the same day, git keeps both sides. Merge buttons in web UIs may ignore `.gitattributes`; the conflict is then trivial: keep both sides, ordered by time.

Two people on the same branch: before rewriting the handoff, the agent pulls if the branch has a remote, and merges its state into a handoff that changed meanwhile instead of overwriting it. If the two disagree, it asks.

## Taking over someone else's work

Check out the branch and ask:

> Where were we?

The agent reads its handoff and the last journal entries, then verifies them against git: new commits since the handoff, uncommitted files, the handoff's verify command. It also looks for merges, because people often merge without an agent: when `develop` was merged into the branch, it compares the files the merge changed (`git diff --stat`) with the files the handoff relies on. A step may already be done, a file may have moved.

If reality disagrees with the handoff, the agent updates the handoff; if that changes the plan, or the handoff has open questions for the user, it asks before acting. Recorded dead ends are not retried unless something changed.

Merges are logged in the journal at the next resume, in the next commit the agent makes anyway, never in a commit of their own.

## Tasks

With `docs/backlog/`, one Markdown file per open task, named like the branch that will do it (a repo that already has `docs/tasks/` or `docs/todo/` keeps it):

```markdown
# CSV export from the list page
Assignee: @jdoe
Why: billing exports the list by hand every month.
Done when: the list page has a link that downloads a CSV that opens in Excel.
Links: docs/design/2026-10-02-csv-export.md
```

- **No status field.** In progress means a branch or handoff exists; done means the file is gone. The branch that does the task deletes its file, so merging the branch closes the task.
- **`Assignee` is optional**, a team handle, never a full name or email. The agent never assigns or reassigns a task unless you ask. In a public repo the handles are public.
- **"What should I work on next?"** or **`/backlog`**: the `backlog` skill puts the current branch's handoff first, then lists the open tasks (title and assignee, no bodies) grouped as yours, unassigned and others (by priority, or the order you ask for, then by backlog order in Jira and oldest first elsewhere), marks those in progress on another branch, and suggests one.
- **Notes** go at the end of the file, one dated line each, added by `/backlog comment`:

  ```markdown
  ## Notes
  - 2026-10-05: billing also wants the archived items
  ```

- **Open questions are tasks too** ("Decide whether archived items are exported"), done when the decision is recorded.
- **New task files** are written for the follow-ups and open questions of a finished branch, or when you ask.

One file per task, rather than a shared `ROADMAP.md`, is what keeps branches from editing the same lines.

### Backlog commands

The same commands work with a task folder, GitLab, GitHub and Jira. In a tracker, every write (new, edit, comment, close) is shown first, as a draft or as before → after with the exact command, and runs only after your yes. In a task folder the agent writes the file directly, because git keeps the old version and you review the diff.

| Command | Example | What happens |
|---|---|---|
| `/backlog` | `/backlog` | The current branch's next step, then the open tasks: yours, unassigned, a count of the others'. Ends with one suggestion and the list of commands. |
| `/backlog new <what>` | `/backlog new Export the item list as PDF. The client wants printable lists; done when the PDF has the CSV columns.` | Drafts title, Why, Done when; asks for what is missing instead of inventing it; checks for duplicates; creates the task file or the issue. No assignee unless you name one; with Roles in `.ai/team.md`, it suggests who could take it. |
| `/backlog edit <task> <change>` | `/backlog edit PODCAST-42 title "Export as PDF and CSV"` · `/backlog edit #42 assign to Simo` | Shows before → after; changes title, description, labels, type or assignee. |
| `/backlog comment <task> <text>` | `/backlog comment #42 the API is ready on staging` | Posts your words as they are (only typos fixed); in a task file, a dated line under `## Notes`. |
| `/backlog close <task> [reason]` | `/backlog close #42 duplicate of #12` · `/backlog close PODCAST-7 we dropped it` | Warns if the task is in progress or assigned to someone else; posts the reason as a comment, then closes (GitHub "not planned" or duplicate, Jira the status you name). A task file is deleted. |
| `/backlog filter <condition>` | `/backlog filter label backend` · `/backlog filter parent PODCAST-10` · `/backlog filter Simo` · `/backlog filter jql: sprint in openSprints()` | Lists only the matching tasks, for that listing. |
| `/backlog help` | `/backlog help` | The commands, where the tasks are, the fixed filter if any. |

Requests in words work the same: "what should I work on next?", "open an issue for the PDF export", "assign #42 to Simo", "close #42, it's a duplicate".

A listing looks like this:

```markdown
Current branch feature/csv-export: next step is the /items.csv route (handoff).

PODCAST, current sprint:
- PODCAST-42 Export as PDF · monacosi (you) · High
- PODCAST-51 Fix date format in feed · unassigned
- 3 assigned to others (rossial 2, bianchia 1)

PODCAST, backlog:
- PODCAST-57 Dark mode toggle · unassigned
- 12 assigned to others

Suggestion: PODCAST-42, yours in the current sprint. To begin: /start PODCAST-42
Commands: new, edit, comment, close, filter, help.
```

Trackers return at most 100 tasks per listing; if there are more, the agent says so and suggests a filter.

### GitLab and GitHub issues

If `origin` is on GitLab or GitHub, setup proposes its issues as the task list, for example:

```markdown
- Tasks: GitLab issues of team/podcast (via glab; writes only with the user's confirmation).
```

- **Access** goes through the CLI, `glab` or `gh`, so it works with any agent. Log in once: `glab auth login` (`--hostname <host>` for a self-hosted GitLab) or `gh auth login`. If the CLI is not logged in, the agent asks whether you want to log in now (you run `! glab auth login` in Claude Code, or the command in a terminal, and it lists again); if not, it explains the steps and stops. It never asks for a token in the chat and never invents issues.
- **Reading** (`/backlog`, viewing an issue) runs without asking. **Writing** (create, close, comment, assign, label) is proposed with the exact command and runs only after you confirm.
- **The `/backlog` commands** work on issues as described in [Backlog commands](#backlog-commands), with issue numbers (`#42`).
- **A new issue** has the shape of a task file: title, then Why, Done when and Links. No assignee unless you ask.
- **Closing:** when a branch's task is done, the agent gives you `Closes #42` for the merge request or pull request description, so the merge closes the issue. GitLab and GitHub honor it only for merges into the default branch: with git flow and `main` as default, an issue closed by a merge into `develop` stays open until the release, or you close it by hand.

### Jira

Typical split: code on GitHub, tasks in Jira Cloud. Setup proposes Jira when branch names or commit subjects keep repeating one key (`PODCAST-123`), or when you name it, and asks for the site if `acli` doesn't show it:

```markdown
- Tasks: Jira PODCAST on example.atlassian.net (via acli; writes only with the user's confirmation).
```

- **Access** goes through Atlassian's CLI, `acli` (`brew tap atlassian/homebrew-acli && brew install acli`, then `acli jira auth login --web`), or the Atlassian connector if `acli` is missing. Login, confirmation and the `/backlog` commands work as for GitLab and GitHub, with Jira keys instead of issue numbers.
- **Listing** uses JQL: open work items of the project (status category not Done), the current sprint first, then the backlog; in each, yours, unassigned, then others, by priority (or the order you ask for) and then backlog order. A project without sprints gets one list. Work items in an In Progress status are marked as in progress.
- **Sprints** are planned by the team in Jira: new work items go to the backlog (if you ask for a sprint, the agent creates it in the backlog and tells you to plan it in Jira), and the agent never moves a work item into or out of a sprint, nor deletes or archives one. Work items in a sprint can be edited, commented on and closed, with your confirmation. `acli` cannot change the priority: the agent uses the Atlassian connector, or tells you to do it in Jira.
- **Linking:** the agent puts the key in the branch name (`feature/PODCAST-123-csv-export`), commit subjects and the pull request title, so Jira's GitHub or GitLab integration links them.
- **Closing:** `Closes #42` doesn't apply. When a branch's task is done, the agent proposes moving the work item to Done after the merge (`acli jira workitem transition`), unless your Jira automation or smart commits (`PODCAST-123 #done`) already do it. Status names follow the project's workflow: for a dropped task, name the status (Won't Do, Cancelled) or the agent asks.

### Filters

- **`/backlog filter <condition>`** lists only the open tasks that match, for that listing: `/backlog filter parent PODCAST-10`, `/backlog filter label backend`, `/backlog filter jql: sprint in openSprints()`. The agent turns the condition into the tracker's own filter (JQL in Jira, `glab` and `gh` flags, `grep` in a task folder) and says when the tracker cannot express it, instead of guessing.
- **A fixed filter** in the block, for a repo that works on part of a shared tracker, applies to every listing, and new tasks get the same parent or label. Ask for it at setup, or later with `/work-journal setup`:

```markdown
- Tasks: Jira PODCAST, parent = PODCAST-10 (via acli; writes only with the user's confirmation).
```

- **`/backlog help`** lists the commands, where the tasks are and the filter in use. In Claude Code, typing `/backlog` also shows the subcommands as a hint, and every listing ends with them in one line.

### People

The same person can be `monacosi` in GitLab, `simone-monaco` on GitHub and an account ID in Jira, and you call them Simo. `.ai/team.md` maps them, one row per person, with the columns aligned so it reads in plain text too:

```markdown
| Handle   | Git              | GitLab   | GitHub        | Jira           | Roles       | Aliases             |
|----------|------------------|----------|---------------|----------------|-------------|---------------------|
| monacosi | Simone Monaco    | monacosi | simone-monaco | 712020:3f1c... | backend, PO | Simone, Simo, Simon |
| rossial  | Alessandro Rossi |          |               | 712020:9a2b... |             | Alessandro          |
```

- "Assign #42 to Simo", "Simo's tasks": the agent matches the name against handles and aliases, ignoring case, and uses the handle of the system in use. With two matches it asks.
- An unknown name: the agent looks the person up in the tracker (project members in GitLab, collaborators on GitHub, an existing assignee or the Atlassian connector in Jira). If the file exists, it proposes the row and adds it when you confirm who it is; without the file, it uses what it found for that request only.
- **Only if you ask for it** ("create the team file"). The file links people's names, nicknames, roles and accounts, which is personal data, so the agent never proposes it on its own, not even at setup. When you ask, it warns you first and looks up no one, not even in `git log`, until you say to go on. Then it fills the table from the git authors of the last 12 months and the tracker's members (GitLab project members, GitHub collaborators, Jira assignees), matched by name: uncertain matches are marked `?` for you to confirm, bots are left out, the first name becomes an alias, Roles stays empty for you to fill. It shows the table and asks whether to commit it or keep it ignored by git:

  ```markdown
  | Handle   | Git              | GitLab | GitHub        | Jira           | Roles | Aliases    |
  |----------|------------------|--------|---------------|----------------|-------|------------|
  | monacosi | Simone Monaco    |        | simone-monaco | 712020:3f1c... |       | Simone     |
  | rossial  | Alessandro Rossi |        | arossi?       | 712020:9a2b... |       | Alessandro |

  `arossi?`: GitHub collaborator without a display name; is it Alessandro Rossi? dependabot[bot] left out.
  Commit it (shared with everyone who has access to the repo) or keep it ignored by git?
  ```
- **Roles** (free text: `backend`, `frontend`, `QA`, `PO`) let the agent suggest who could take a new task, with how many open tasks each already has. It only suggests: assigning is up to you. For example, after `/backlog new Dark mode toggle for the list page`:

  ```markdown
  Who could take it (frontend): giulia-bianchi (2 open tasks), monacosi (5 open tasks).
  Assign it to one of them? Otherwise it stays unassigned.
  ```
- **Committed or ignored, your choice.** Committed, one shared file serves everyone, who already sees these names in git and the tracker. In a public repo the agent recommends keeping it ignored, so that accounts, nicknames and roles don't go online. Only handles, account IDs, display names, roles and aliases, no emails. Edit it by hand whenever you like.
- Task files use the Handle column in `Assignee:`. The row whose Git column matches your `git config user.name` is you, so a task folder can tell which tasks are yours.

Other trackers work the same way through a connector. With no task list, follow-ups go in the final message and the journal.

## Design decisions

Written when a branch's task is done, or earlier when you ask to record a decision: what a successor needs to know about why. Constraints, decisions not evident from the code, alternatives discarded and the reason. Not task logs, test counts or branch state: git has those.

A document that no longer holds is deleted (git keeps it). One that holds in part gets a box at the top, `> ⚠️ **Superseded …**`, saying what no longer holds and what does.

With `none`, decisions go in a comment next to the code they concern, in the README for decisions about the whole project, or in the commit message.

## When a branch's task is done

When nothing is left on the branch, the agent says so and suggests `/finish`, without picking a mode, and waits. `/finish` runs these steps after its checks; the agent runs them without it only if you want the task closed that way (an abandoned branch, a merge you do by hand).

1. **Keep what must last.** Decisions and dead ends from the handoff that will matter after the branch go where people look: a comment next to the code, the design decisions, or a custom rule in `.ai/phase.md` if it is a rule to always follow. "It's in the journal" doesn't count: the journal gets buried.
2. **Close the task, file the rest.** The branch's task file is deleted; follow-ups and open questions become new tasks.
3. **Delete the handoff**, and write a journal entry naming what was moved and the new tasks.

## Years later

- **The journal grows, the cost doesn't.** Resuming reads only the newest journal file. Older entries are searched with `grep -rl <keyword> .ai/journal`, not read. The agent never deletes or summarizes old journals; prune them by hand if you want, git keeps them.
- **The debt list stays short.** Fixed items are deleted, accepted items stay with their reason, because they record a decision.
- **The phase history** in `.ai/phase.md` shows when and why the phase changed, and which phases were confirmed when the agent asked.

## Privacy

The files are readable by everyone with access to the repo. The agent never writes secrets, tokens, passwords, connection strings, customer data or personal data; it names them instead ("the staging API key in the team vault"). In a public repo, write as if the journal were public, because it is.
