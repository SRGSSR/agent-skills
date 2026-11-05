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
| "Assign #42 to Simo." | Finds Simo's handle for that tracker in `.ai/team.md` (or asks and adds the row), shows the change, assigns after your confirmation |
| `/backlog filter <condition>`, `/backlog help` | Lists only the tasks that match (parent, epic, label, sprint, JQL...); shows the commands |
| `/project-phase off`, `/work-journal off` | Replaces the block with an off marker, keeps `.ai/` |
| `/project-phase setup`, `/work-journal setup` on a project already set up | Shows the current choices, proposes only what the repo signals suggest changing (phase, set, task place, filter), changes what you confirm |
| `/project-phase help`, `/work-journal help` | The skill's commands and its current settings; in Claude Code, typing the command also shows the subcommands |
