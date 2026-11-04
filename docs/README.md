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
| "Set up the project phase for this repo." | Proposes a phase and a set from repo signals, asks you to confirm, writes the block and `.ai/phase.md` |
| "Set up the work journal." | Adds the journal block, asks where design decisions and tasks go |
| "We're just prototyping, stop over-engineering." | Checks the phase; proposes prototype if it isn't |
| "What phase are we in, and what's in the debt list?" | Phase and since when, what it means in practice, overrides, open debt |
| "We're launching next month. Move us to stabilize." | Runs the transition checklist, proposes a prioritized plan, records it in `.ai/debt.md` |
| "Review the tech debt." | Proposes what to fix, accept or drop for the current phase |
| "Let's stop here, I'll continue tomorrow." | Writes the branch's handoff |
| "Where were we?" | Reads the handoff, checks it against git, continues |
| "What should I work on next?" | Lists the open tasks, preferring unassigned ones or yours |
| `/project-phase off`, `/work-journal off` | Replaces the block with an off marker, keeps `.ai/` |
