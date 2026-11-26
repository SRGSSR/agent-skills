# Getting started with work-journal

How to set up the journal in a brand-new repo or in one with history, how pausing and resuming work, and how a piece of work ends. Install the plugin first ([Install](../../../README.md#install)).

## Set up the journal

> Set up the work journal.

Or `/work-journal setup`. The agent adds its block to `AGENTS.md` (about 9 lines) and the line `.ai/journal/*.md merge=union linguist-generated=true` to `.gitattributes`.

You don't have to ask for the setup: the first time the agent writes a journal entry in a repo without the block (for example when you say "let's stop here"), it sets the journal up and asks about decisions and tasks in its final message.

`.ai/` is meant to be committed, so the handoff travels with the repo. To keep the journal private, add `.ai/journal/` to `.gitignore` and keep `.ai/handoff/` committed.

On Windows, `/finish` and `/start` run their git checks as a `sh` script. If `sh` isn't on your PATH but Git for Windows is installed, setup tells you to add its `bin` folder (for example `C:\Program Files\Git\bin`) to PATH; it never changes PATH itself. Claude Code with Git for Windows can still run the script through its Bash tool, which uses Git Bash; an agent with no way to run `sh` runs the same checks by hand, at a higher token cost.

### A new repo

Setup asks where two things go, because a new repo has nothing to detect:

- **Design decisions**, the why behind the code: `docs/design/` (one file per decision), a single `docs/decisions.md` for a small project, or none (code comments, commit messages, README).
- **Tasks**, open work and open questions: `docs/backlog/` (one file per task), GitLab or GitHub issues (through `glab` or `gh`), Jira (through `acli` or the Atlassian connector) or another tracker with a connector, or none (follow-ups go in the agent's final message).

The answer becomes the first two lines of the block, for example:

```markdown
- Design decisions: `docs/design/`.
- Tasks: `docs/backlog/`, one file per open task.
```

The folders are created by the first file, not at setup. For a quick prototype, `none` for both is a fine start: you can change the two lines later, by hand or with `/work-journal setup`.

### A repo with history

For a repo that may already have ADRs, a `ROADMAP.md` or an issue tracker. Setup looks for what the repo already uses and asks only about what it could not detect, in one question:

| The repo has | Design decisions | Tasks |
|---|---|---|
| `docs/adr/`, `docs/decisions/` or `docs/design/` | Used as it is, following its convention | |
| `ROADMAP.md` or `TODO.md` with open work | | The agent offers to split it into `docs/backlog/` files; without a yes, that file is named as the task list and keeps its format |
| `docs/tasks/` or `docs/todo/` with one file per task | | Kept and named in the block |
| `origin` on GitLab or GitHub, Jira keys in branch names or commit subjects, or a tracker connector | | Its issues are proposed as the task list; writes (create, close, comment) only with your confirmation |
| Nothing | `docs/design/`, `docs/decisions.md` or none | `docs/backlog/` or none |

Setup never creates `.ai/team.md`, the map of who is who on each system: it holds personal data, so it is made only when you ask for it. See [People](teams.md#people).

A tracker looks like this in the block:

```markdown
- Tasks: Jira PODCAST on example.atlassian.net (via acli; writes only with the user's confirmation).
```

### Changing the choices later

Run `/work-journal setup` again on a project already set up. The agent shows the current choices, reads the signals again and proposes only what they suggest changing, for example Jira keys that appeared in the commits since setup. It changes only what you confirm. The journal, handoffs, task files, design decisions and `.ai/team.md` stay as they are; moving existing task files to a tracker is a separate step, one confirmed issue at a time.

## Pausing and resuming

> Let's stop here, I'll continue tomorrow.

The agent writes `.ai/handoff/<branch>.md` (for `main`: `.ai/handoff/main.md`): goal, status, next steps, decisions, dead ends, open questions, how to verify. It is written for a reader with zero context, so the next session can be another tool or model:

```markdown
# Handoff
Updated: 2026-11-04 17:40 · by: claude-code/claude-opus-5-5
Branch: feature/csv-export · Base: develop · Last commit: a1b2c3d · Uncommitted: none

## Goal
Users download the item list as CSV, and it opens correctly in Excel.

## Status
- [x] `GET /items.csv` streams the rows
- [ ] Download link on the list page

## Next steps
1. Add the "Download CSV" link to `renderList()` in `server.js`.

## How to verify
- `npm test`, then open http://localhost:3000 and click the link.
```

Decisions, dead ends and open questions get their own sections when there are any. `Base:` is the branch this one started from, written by `/start`.

> Where were we?

The agent reads the handoff and the last journal entries, checks them against git (new commits, merges, uncommitted files), says in one or two lines what it is resuming, and continues. If something changed the plan, or the handoff has open questions for you, it asks first.

In Claude Code you don't need to ask: when a session starts on a branch with a handoff, Claude Code shows a line that says so (`work-journal · feature/csv-export has a handoff: /start resumes it, /pause parks it, /finish closes it.`), and Claude resumes from the handoff before answering your first message. On a branch without one, the line lists the other local branches that have one.

For a pause that is checked first, type `/pause`:

> /pause until billing answers about archived items

The agent compares the conversation, the repo and the handoff, and looks for what a reader who was not there would miss: a decision taken in the chat and its reason, an approach that was dropped, a failing test, something waiting on someone, uncommitted files, a stash or a server left running. It asks only about what it can't settle on its own, in one message, for example:

```markdown
Before pausing, two things:
1. `server.js` has uncommitted changes (the `/items.csv` route, half written). Commit them
   on the branch as `wip: items.csv route`, or leave them in the working tree?
2. You chose `;` over tab as separator: because of Excel de-CH, or another reason?
```

Then it rewrites the handoff (with a `Paused:` line saying why and until when, if you said so), adds a journal entry, commits both on the branch, and tells you how to resume. Nothing is pushed or stashed, and the branch and its task stay open. Text after `/pause` is instructions for this run; `/pause help` shows what gets checked.

To resume, `/start` on that branch (or `/start <task>` from another one) does the same as "Where were we?", and first checks that the branch and its base are up to date with `origin` and free of conflicts with each other, as `/finish` does: if one is behind it asks whether to update it, and conflicts are resolved, after your yes, before the work goes on.

Write the handoff before you need it: on long tasks the agent also rewrites it at milestones and when the context is getting long, so a crash or an exhausted quota still leaves a usable state.

## When a piece of work is done

Start each piece of work with `/start <task or name>`, which opens its branch and handoff, stop it in between with `/pause`, and end it with `/finish merge` (or `merge-request`, `pull-request`; `/finish help` lists them), which checks that it is done and documented before merging. When nothing is left for the agent on a branch, it says so and suggests `/finish` instead of leaving a stale handoff. `/finish` (or the agent, if you close the task without it) then closes the loop:

1. Decisions and dead ends that matter beyond the branch go to code comments or the design decisions.
2. The branch's task file is deleted (merging the branch closes the task); follow-ups and open questions become new tasks.
3. The handoff is deleted, and a journal entry says what was done and moved.

## Soft mode

If trackers and task lists are not your thing, turn on soft mode:

> /work-journal soft on

The agent adds the line `work-journal: soft` to your global instructions (`~/.claude/CLAUDE.md` for Claude Code, `~/.codex/AGENTS.md` for Codex). Each tool has its own file, so it is on in the tool where you ran the command; run it again in the others. It is yours, not the project's: it applies in every repo with the work-journal block, and colleagues are not affected. `/work-journal soft off` removes the line. To try it without changing anything, `/work-journal soft once` turns it on for the current session only.

With it on, something to remember becomes a reminder in the handoff, not a task:

```markdown
You:    Rename formatRow to formatCsvRow, and we must remember to tell billing about the new separator.
Agent:  Renamed in src/export.js. Shall I note that billing still needs to hear about the new separator?
You:    Yes.
Agent:  Noted in the handoff.
```

The handoff then has, and is committed with the next commit:

```markdown
## Reminders
- @jdoe · 2026-11-19: tell billing that the separator changed.
```

Next time you resume, one line says "Still noted: tell billing about the separator." The same line comes up when the work touches what the reminder is about, and before `/finish`. At `/finish` the agent lists what is left, with what it would do with each (done, dropped or a task), and waits for your answers. A task is proposed instead of a reminder only when the thing is for someone else or can't be done before the branch finishes.

On a branch with no handoff, and after `/finish`, the agent also names the tasks assigned to you and offers the first with `/start`, which then splits it into small steps, offered one at a time.

## Upgrading from an older version

Nothing to do by hand. When the agent resumes work in a repo with an older `work-journal` block, it replaces the block (keeping your configuration lines) and says so in one line; `/work-journal setup` does the same on request. A block from 0.3 or earlier has no configuration lines: the agent asks where design decisions and tasks go. An old single `.ai/handoff.md` becomes the handoff of its branch the next time the handoff is written.

## With project-phase

`work-journal` works on its own. With [`project-phase`](../../project-phase/README.md) also installed, the handoff header gets a `Phase:` line, phase changes are logged in the journal, and in explore and prototype the journal keeps only decisions, dead ends and session ends, to keep the overhead in line with the phase. `.ai/debt.md` keeps tracking shortcuts in the code; when the team decides to fix one, the task links the debt item instead of copying it.

## Next

Several people, many branches, a project that lasts years: [Teams and long-lived projects](teams.md).
