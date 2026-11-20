# Teams and long-lived projects

How `work-journal` and its commands behave when several people and agents work on the same repo, on different branches, over months or years.

## What lives where

| Place | Content | Shared how |
|---|---|---|
| `AGENTS.md` block | Journal protocol (and the phase contract, with `project-phase`) | Committed; loaded by every agent on every task |
| `.ai/phase.md` | With `project-phase`: phase, overrides, custom rules, history | Committed |
| `.ai/debt.md` | With `project-phase`: open and accepted tech debt | Committed; `merge=union` |
| `.ai/journal/YYYY-MM-DD.md` | What was done, decided, abandoned | Committed (or ignored, if the team prefers); `merge=union` |
| `.ai/handoff/<branch>.md` | State of one branch | Committed; one file per branch |
| Design decisions (for example `docs/design/`) | Why things are the way they are | Committed, written for people |
| Tasks (`docs/backlog/` or a tracker) | Open work and open questions | Committed, or in the tracker |
| `.ai/team.md` | Each person's handle on git, GitLab, GitHub and Jira, roles and nicknames | Only if you ask for it; committed or ignored by git, your choice |

`.ai/` is the agents' working state; design decisions and tasks are for people. The agents' private memory is not used for project state, because other agents and people can't read it.

## Branches

Each branch has its own handoff (`feature/csv-export` → `.ai/handoff/feature-csv-export.md`), so people on different branches never overwrite each other's state. When the branch's task is done, its handoff is deleted.

### Starting, pausing and finishing a branch

> /start PODCAST-42 export the item list as CSV

The agent checks that nothing is left uncommitted or half done, reads the task, and opens `feature/PODCAST-42-csv-export`: with `git flow feature start` if the repo uses git flow, otherwise from the development branch. It writes the handoff with the task's goal and `Base: develop` (where the branch started), adds a journal entry, commits both on the new branch, and offers to assign the task to you and move it to In Progress (Jira), after your yes. If a branch for the task already exists, it resumes it from its handoff instead; `/start` alone resumes the current branch. Asked in words ("let's start on PODCAST-42"), it proposes `/start` and waits.

> /pause Anna takes over on Monday

The agent checks that everything Anna needs is written down (status, next steps, decisions with their reasons, dead ends, problems, what waits on whom, open questions, uncommitted changes), asks you about what it can't tell, then rewrites the handoff with `Paused: 2026-11-19 · Anna takes over on Monday`, adds a journal entry and commits both on the branch. The branch and its task stay open and assigned. Nothing is pushed: if the branch has commits that are not on the remote, the agent gives you `git push -u origin <branch>`, since Anna only gets what is pushed. See [Pausing and resuming](getting-started.md#pausing-and-resuming).

> /finish merge

The agent checks everything first: no stray uncommitted changes, build and tests green, nothing open in the handoff, docs complete for what the branch changed (each new command, option or behavior described where users look, with an example wherever similar things have one, nothing describing the old behavior), decisions and dead ends moved, follow-ups filed as tasks. If anything is missing it stops, lists it and asks. Otherwise it closes the task, deletes the handoff, writes the journal entry, commits, and integrates the way you named:

| Mode | What happens |
|---|---|
| `/finish merge` | git flow: `git flow feature finish`. Otherwise a merge into the `Base:` branch and the local branch deleted; if the base is `main`, it asks once first. A tracker task is closed after your yes, since a local merge doesn't trigger `Closes #42`. |
| `/finish mr`, `/finish merge-request` | A GitLab merge request into the base, with a title, a detailed description (introduction, changes, how to test) and `Closes #42` (or the Jira key); it asks who reviews it and whom to assign it to |
| `/finish pr`, `/finish pull-request` | The same as a GitHub pull request |

If a check fails, nothing is committed or merged, for example:

```markdown
/finish merge stopped: one problem.
- docs/usage.md shows a command line for npm start and npm test, but not for the new
  `node bin/export.js > items.csv`. Add it there and in docs/csv-export.md?
Everything else is ready: tests 2/2, handoff closed, decisions in docs/csv-export.md.
```

For `/finish pr` the agent prepares the title and the description from the task, the handoff, the commits and the journal. The description is written for a reviewer who was not there: a short introduction, the changes in detail, then everything needed to test (the specifications with a link to their issue, the steps with the expected result, the edge cases, and what nobody tried):

```markdown
PODCAST-42 CSV export

Users can download the item list as CSV from the list page. The file opens
in Excel (de-CH) with no import step, which is what the client asked for.

## Changes
- `toCsv(items)` in `export.js`: `;` separator and UTF-8 BOM, values with `;`, quotes or
  line breaks are quoted.
- "Download CSV" link on the list page (`views/list.html`), served by `GET /items.csv`.
- Decided: `;` rather than `,`, because Excel de-CH splits on `;` (docs/csv-export.md).
- Left out: choosing the columns. The file has the columns of the list page.

## How to test
Specifications (PODCAST-42):
- The list page has a link that downloads all items as CSV.
- The file opens in Excel (de-CH) with one value per cell and correct umlauts.

Steps:
1. `npm test`: 6 tests pass (separator, BOM, quoting).
2. `npm start`, open http://localhost:3000 and click "Download CSV": `items.csv` is
   downloaded, one row per item.
3. Open the file in Excel (de-CH): one value per cell, "Mikrofonständer" is readable.

Edge cases:
- An item with `;` or `"` in its name: one cell, the quotes are shown.
- No items: the file has the header row only.
- Not tried: more than 10,000 items; Excel on macOS.

PODCAST-42
```

A small change gets shorter parts, but all three. The agent also asks, once and together with the confirmation, what you didn't say: who reviews the request (the one who checks and approves it) and whom to assign it to (the one who carries it to the merge: you, someone else or nobody). "Nobody" is a fine answer to both.

Anything after the mode is instructions for this run: options of the request, a title, a problem you accept.

> /finish pr as a draft, assign it to me, reviewer anna, the flaky upload test is known

The agent still runs every check: it reports the flaky test as accepted instead of stopping, and adds `--draft --assignee @me --reviewer anna` to `gh pr create`, without asking about either. Instructions never make it push or force.

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
- **`Postponed` is optional**: the task waits, with the date it can resume if known (`Postponed: 2027-01-15`). Delete the line to resume it.
- **`Assignee` is optional**, a team handle, never a full name or email. The agent never assigns or reassigns a task unless you ask. In a public repo the handles are public.
- **"What should I work on next?"** or **`/backlog`**: the `backlog` skill puts the current branch's handoff first, then lists the open tasks in a table (title and assignee, no bodies) grouped as yours, unassigned and others (by priority, or the order you ask for, then by backlog order in Jira and oldest first elsewhere), marks those in progress on another branch, and suggests one. A postponed task (a label, status or milestone like On hold, or a `Postponed:` line) shows the date it can resume, taken from a field for it, the description or the comments, and is not suggested before that date.
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
| `/backlog new <what>` | `/backlog new Export the item list as PDF. The client wants printable lists; done when the PDF has the CSV columns.` | Drafts title, Why, Done when; asks for what is missing instead of inventing it; checks for duplicates; creates the task file or the issue. No assignee unless you name one; with Roles in `.ai/team.md`, it suggests who could take it. For someone else, the description explains what to do, where, what is known and whom to ask. |
| `/backlog edit <task> <change>` | `/backlog edit PODCAST-42 title "Export as PDF and CSV"` · `/backlog edit #42 assign to Simo` | Shows before → after; changes title, description, labels, type or assignee. Assigning to someone else whose description is too thin, it also proposes a fuller one. |
| `/backlog comment <task> <text>` | `/backlog comment #42 the API is ready on staging` | Posts your words as they are (only typos fixed); in a task file, a dated line under `## Notes`. |
| `/backlog close <task> [reason]` | `/backlog close #42 duplicate of #12` · `/backlog close PODCAST-7 we dropped it` | Warns if the task is in progress or assigned to someone else; posts the reason as a comment, then closes (GitHub "not planned" or duplicate, Jira the status you name). A task file is deleted. |
| `/backlog filter <condition>` | `/backlog filter label backend` · `/backlog filter parent PODCAST-10` · `/backlog filter Simo` · `/backlog filter jql: sprint in openSprints()` | Lists only the matching tasks, for that listing. |
| `/backlog help` | `/backlog help` | The commands, where the tasks are, the fixed filter if any. |

Requests in words work the same: "what should I work on next?", "open an issue for the PDF export", "assign #42 to Simo", "close #42, it's a duplicate".

A listing looks like this:

```markdown
Current branch feature/csv-export: next step is the /items.csv route (handoff).

PODCAST, current sprint:

| Task       | Title                   | Assignee       | Priority | Status |
|------------|-------------------------|----------------|----------|--------|
| PODCAST-42 | Export as PDF           | monacosi (you) | High     |        |
| PODCAST-51 | Fix date format in feed | unassigned     | Medium   |        |

3 assigned to others (rossial 2, bianchia 1).

PODCAST, backlog:

| Task       | Title            | Assignee   | Priority | Status                     |
|------------|------------------|------------|----------|----------------------------|
| PODCAST-57 | Dark mode toggle | unassigned | Low      | postponed until 2027-01-15 |

12 assigned to others.

Suggestion: PODCAST-42, yours in the current sprint. To begin: /start PODCAST-42
Commands: new, edit, comment, close, filter, help.
```

When every row is yours ("what is assigned to me?"), the Assignee column is left out, since it would only repeat your name:

```markdown
| Task       | Title              | Priority | Status      |
|------------|--------------------|----------|-------------|
| PODCAST-42 | Export as PDF      | High     |             |
| PODCAST-48 | Feed cache headers | Medium   | in progress |
```

Trackers return at most 100 tasks per listing; if there are more, the agent says so and suggests a filter.

### Request commands

`/request` does for merge requests (GitLab) and pull requests (GitHub) what `/backlog` does for tasks. Creating one stays with `/finish mr` or `pr`, which checks the work first; closing one is done on the host.

| Command | Example | What happens |
|---|---|---|
| `/request` | `/request` · `/request Anna` | The open requests: the approved ones assigned to you first, then those waiting for your review, then the rest of yours and a count of the others'. Ends with one suggestion and the list of commands. With a name, only that person's. |
| `/request <id>` | `/request 12` · `/request feature/csv-export` | Title, people, state, the issues it closes, the description and the open review comments. If you are a reviewer, it asks whether to start the review; if it is yours and the review asks for changes, it offers to resume the branch. |
| `/request edit <id> <change>` | `/request edit 12 add Simo as reviewer` · `/request edit 12 ready` · `/request edit 12 rewrite the description` | Shows before → after and the command; changes title, description, reviewers, assignee, labels, draft or ready. A rewritten description gets the three parts of `/finish`. |
| `/request comment <id> <text>` | `/request comment 12 the staging data is refreshed` | Posts your words as they are (only typos fixed), after your yes. |
| `/request test <id>` | `/request test 12` | Runs the request's `How to test` steps and edge cases in a worktree of its own, and reports each as passed, failed or not run. |
| `/request review <id>` | `/request review 12` | The reviewer's whole path: shows the request, runs its tests, reads the diff against the issues, reports, and suggests a code review tool for the code itself. |
| `/request approve <id>` | `/request approve 12` · `/request approve 12, I opened the file in Excel, fine` | Your yes as a reviewer. It first asks about every step it could not run, then shows the commit and the command, and approves after your yes. |
| `/request changes <id> <reason>` | `/request changes 12 archived items are still exported` | Your no as a reviewer: asks the author for changes, with the reason written for them. The request stays open. |
| `/request merge <id>` | `/request merge 12` · `/request merge 12 squash` | Merges an approved request on the host, after its checks and your yes; then offers to switch to the base, update it and delete the local branch. |
| `/request help` | `/request help` | The commands, the host and the CLI in use. |

Requests in words work the same: "what is waiting for my review?", "show me !12", "mark !12 as ready", "test Anna's request", "review !12", "approve it", "reject !12: archived items are still exported".

A listing looks like this:

```markdown
To merge:

| Request | Title                 | Approved by | State |
|---------|-----------------------|-------------|-------|
| !9      | PODCAST-40 Feed title | bianchia    |       |

To review:

| Request | Title                   | Author   | State          |
|---------|-------------------------|----------|----------------|
| !12     | PODCAST-42 CSV export   | rossial  |                |
| !15     | Fix date format in feed | bianchia | checks running |

Yours:

| Request | Title                         | Reviewers | State             |
|---------|-------------------------------|-----------|-------------------|
| !14     | PODCAST-48 Feed cache headers | rossial   | changes requested |
| !16     | Dark mode toggle              | none      | draft             |

3 others (bianchia 2, rossial 1).

Suggestion: !9 is approved and assigned to you: /request merge 9
Commands: <id>, edit, comment, test, review, approve, changes, merge, help.
```

`/request test` reads the `How to test` part that `/finish` writes, compares it with the specifications of the linked issues, and runs it on a copy of the branch, so your own branch and uncommitted work stay as they are:

```markdown
!12 PODCAST-42 CSV export, tested at 4f2a9c1.

| Step                                    | Result  | What happened                                    |
|-----------------------------------------|---------|--------------------------------------------------|
| 1. `npm test`                           | passed  | 6 tests pass                                     |
| 2. Download from the list page          | passed  | GET /items.csv: 200, one row per item            |
| 3. Open the file in Excel (de-CH)       | not run | needs a person: no Excel here                    |
| Edge: an item with `;` in its name      | passed  | the value is quoted, one cell                    |
| Edge: no items                          | failed  | expected the header row only, got an empty file  |
| Added: PODCAST-42 asks for a `.csv` name | passed  | Content-Disposition names `items.csv`            |

Not covered by the description: the file name asked for in PODCAST-42 (step added).
4 passed, 1 failed, 1 not run. Post this as a comment on !12?
```

- **What it can run:** commands, HTTP calls, the output of a CLI, the content of files; steps in a user interface only if the agent has a browser tool. What needs a person is reported as not run, never guessed.
- **What it never does:** fix the code, commit, push, approve or merge. It uses test data and `.env.example` only: a step that needs real credentials, production data or a real effect (an email, a payment) is not run.
- **Requests from a fork:** testing runs that code on your machine, so the agent asks first.
- The report is posted on the request only after your yes.

`/request review` adds to the tests a read of the diff, for what running the steps cannot show. After the test table it lists what it found:

```markdown
Should block the merge:
- `export.js:41`: PODCAST-42 asks for the archived items to be left out; `toCsv` exports them all.

To consider:
- `views/list.html:18`: the new "Download CSV" link is not in docs/usage.md.
- `routes/items.js`: the `/items.csv` route has no automated test.

Left for you: step 3 (open the file in Excel).
I recommend asking for changes: /request changes 12, with the "no items" edge case and
the archived items as the reason.
For the code itself, a code review tool can go further: in Claude Code, /code-review.
Post the review as a comment on !12?
```

It is not a line-by-line hunt for bugs. The verdict is yours, given with `/request approve` or `/request changes`, and the agent's advice goes one way only. When a step failed or a finding should block the merge, it recommends asking for changes, with the reasons ready to send. When nothing blocks, it says so and lists what is still missing before an approval (the steps it could not run, a read of the code), but never recommends approving:

```markdown
I found nothing that blocks. Before approving, what is left: step 3 (open the file in
Excel), and a read of the code.
```

Before approving, the agent asks about what it could not test, and a plain "yes" is not an answer to that:

```markdown
> /request approve 12

Before approving !12 (4f2a9c1), one step was not run by me:
- Step 3, open the file in Excel (de-CH): one value per cell, readable umlauts.
Did you or someone else run it? With what result?

> yes, I opened it in Excel, all fine

I will approve !12 at 4f2a9c1: steps 1, 2 and the edge cases tested by me, step 3 by you.
  glab mr approve 12 --sha 4f2a9c1
Go ahead?
```

It also says what else stands in the way (a draft, failed checks, conflicts, findings that should block the merge, commits newer than those tested), and approves the exact commit that was tested. If you approve without a step, the confirmation names it as not tested.

`/request changes` needs a reason; without one, the agent proposes the blocking findings and the failed steps of its review. "Reject" in words means the same: the request stays open for its author, and closing it for good is done on the host. On GitHub this sets "changes requested"; `glab` has no command for it, so on GitLab the reason is posted as a comment (and an approval you gave is revoked), and the agent says that the Request changes button on the host marks it formally.

`/request merge` is for whoever carries the request: its assignee, or its author when nobody is assigned. The hosts decide who may merge by permissions, not by that field, so the agent doesn't refuse anyone else, but asks first, as a question of its own. That includes a reviewer who has just approved it:

```markdown
> /request merge 12

!12 is assigned to rossial, and you reviewed it. Merging it is theirs: do you want to
merge it all the same?

> yes, Alessandro is away until Monday

!12 PODCAST-42 CSV export, develop ← feature/PODCAST-42-csv-export at 4f2a9c1,
approved by you. Checks passed, no conflicts, no open comments.
  glab mr merge 12 --sha 4f2a9c1 --auto-merge=false --yes
Go ahead?
```

- **Checked first:** approved by someone other than the author, no changes requested, not a draft, checks passed, no conflicts, no open review comments, no commits after the approval. With any problem the agent stops and lists them all.
- **Never forced:** what the host refuses (a protected branch, a required check) stays refused. A base that is `main` or a release branch gets one more question.
- **How:** the project's way; say `squash` or `rebase` to choose. The source branch is deleted only if you ask or the host is set to.
- **Afterwards** the agent offers to switch to the base, update it and delete the local branch; it never pushes.

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

## Soft mode on a shared project

[Soft mode](../README.md#soft-mode) belongs to the person, not the project: it is on for whoever has `work-journal: soft` in their global instructions, and nobody else notices. On a shared branch:

- **Reminders live in the committed handoff**, under `## Reminders`, one line each with the handle of whoever noted it and the date (`- @anna · 2026-11-19: tell billing that the separator changed.`). The handle is the one used for `Assignee:`.
- **Each person is reminded only of their own.** Other people's lines are theirs.
- **A colleague not in soft mode keeps them.** Whoever rewrites the handoff, in soft mode or not, keeps every Reminders line as it is, also other people's, so `/pause` or a handover doesn't lose them.
- **`/finish` closes them all, whoever finishes.** Every reminder left is listed with a proposal (done, dropped or a task) and answered one by one before the handoff is deleted.
- **For someone else, a task.** A reminder in the handoff doesn't reach a colleague, so what is for another person is proposed as a task.

## Design decisions

Written when a branch's task is done, or earlier when you ask to record a decision: what a successor needs to know about why. Constraints, decisions not evident from the code, alternatives discarded and the reason. Not task logs, test counts or branch state: git has those.

A document that no longer holds is deleted (git keeps it). One that holds in part gets a box at the top, `> ⚠️ **Superseded …**`, saying what no longer holds and what does.

With `none`, decisions go in a comment next to the code they concern, in the README for decisions about the whole project, or in the commit message.

## When a branch's task is done

When nothing is left on the branch, the agent says so and suggests `/finish`, without picking a mode, and waits. `/finish` runs these steps after its checks; the agent runs them without it only if you want the task closed that way (an abandoned branch, a merge you do by hand).

1. **Keep what must last.** Decisions and dead ends from the handoff that will matter after the branch go where people look: a comment next to the code, the design decisions, or, with `project-phase`, a custom rule in `.ai/phase.md` if it is a rule to always follow. "It's in the journal" doesn't count: the journal gets buried.
2. **Close the task, file the rest.** The branch's task file is deleted; follow-ups and open questions become new tasks.
3. **Delete the handoff**, and write a journal entry naming what was moved and the new tasks.

## Years later

- **The journal grows, the cost doesn't.** Resuming reads only the newest journal file. Older entries are searched with `grep -rl <keyword> .ai/journal`, not read. The agent never deletes or summarizes old journals; prune them by hand if you want, git keeps them.
- **The debt list stays short** (with `project-phase`). Fixed items are deleted, accepted items stay with their reason, because they record a decision.
- **The phase history** (with `project-phase`) in `.ai/phase.md` shows when and why the phase changed, and which phases were confirmed when the agent asked.

## Privacy

The files are readable by everyone with access to the repo. The agent never writes secrets, tokens, passwords, connection strings, customer data or personal data; it names them instead ("the staging API key in the team vault"). In a public repo, write as if the journal were public, because it is.
