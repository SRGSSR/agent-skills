# Guides

Step-by-step guides for the situations you meet with `project-phase` and `work-journal`. For what the skills are and how to install them, start from the [main README](../README.md).

| Situation | Guide |
|---|---|
| Empty or brand-new repo, trying an idea | [New project](new-project.md) |
| Repo with history, maybe live, with its own docs or tracker | [Project already under way](existing-project.md) |
| Several people, many branches, a project that lasts years | [Teams and long-lived projects](teams.md) |
| Launch, maintenance, end of life; the agent asking about the phase; switching off | [Changing phase](phase-changes.md) |

## What to say

The skills react to plain requests, in any language. A few that cover most needs:

| You say | The agent |
|---|---|
| "Set up the project phase for this repo." or `/project-phase setup` | Proposes a phase and a set from repo signals, asks you to confirm, writes the block and `.ai/phase.md` |
| "Set up the work journal." or `/work-journal setup` | Adds the journal block, asks where design decisions and tasks go |
| "We're just prototyping, stop over-engineering." | Checks the phase; proposes prototype if it isn't |
| "What phase are we in, and what's in the debt list?" or `/project-phase` | Phase and since when, what it means in practice, overrides, open debt |
| "We're launching next month. Move us to stabilize." | Runs the transition checklist, proposes a prioritized plan, records it in `.ai/debt.md` |
| "Review the tech debt." | Proposes what to fix, accept or drop for the current phase |
| "Let's stop here, I'll continue tomorrow." | Writes the branch's handoff |
| "Where were we?" or `/work-journal` | Reads the handoff, checks it against git, continues |
| "What should I work on next?" or `/backlog` | Lists the open tasks (folder, GitLab or GitHub issues, Jira): yours, unassigned, others; suggests one |
| `/backlog new <what>`, `/backlog edit <task> <change>`, `/backlog comment <task> <text>`, `/backlog close <task>` | Creates, edits, comments on or closes a task; issues only after your confirmation |
| "Who could take PODCAST-57?" | Suggests people whose Roles in `.ai/team.md` match the task, with their open tasks; assigns only if you ask |
| "Assign #42 to Simo." | Finds Simo's handle for that tracker in `.ai/team.md` (or in the tracker, asking if unclear), shows the change, assigns after your confirmation |
| "Create the team file." | Warns that `.ai/team.md` holds personal data and asks whether to go on; then fills it from git and the tracker, shows it, and asks whether to commit it or keep it ignored by git. Never proposed unasked |
| `/backlog filter <condition>`, `/backlog help` | Lists only the tasks that match (parent, epic, label, sprint, person, JQL...); shows the commands |
| "Let's start on PODCAST-42." or `/start PODCAST-42` | Opens `feature/PODCAST-42-<slug>` from the development branch (git flow if used), writes the handoff with the task's goal, offers to assign the task to you and mark it in progress |
| `/finish merge`, `/finish merge-request` (`mr`), `/finish pull-request` (`pr`), optionally followed by instructions (`/finish pr as a draft`) | Checks commits, build and tests, handoff, docs (with examples where similar things have them), decisions and follow-ups; stops and asks if something is missing; otherwise merges (git flow finish, or into the branch it started from) or prepares the merge or pull request |
| `/project-phase off`, `/work-journal off` | Replaces the block with an off marker, keeps `.ai/` |
| `/project-phase setup`, `/work-journal setup` on a project already set up | Shows the current choices, proposes only what the repo signals suggest changing (phase, set, task place, filter), changes what you confirm |
| `/project-phase help`, `/work-journal help` | The skill's commands and its current settings; in Claude Code, typing the command also shows the subcommands |

An example for each `/backlog` command, and what a listing looks like: [Backlog commands](teams.md#backlog-commands).

Why the skills work the way they do, and what was discarded: [Design notes](design.md).
