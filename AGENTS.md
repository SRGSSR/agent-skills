# Project phase & work journal skills

Open-source Agent Skills in two Claude Code plugins, listed in `.claude-plugin/marketplace.json`: `plugins/project-phase/` (skill `project-phase`) and `plugins/work-journal/` (skills `work-journal`, `backlog`, `start`, `finish`), each with its skills under `skills/` and its version in `.claude-plugin/plugin.json`. Eval fixtures, cases and grader in `evals/`.
Build eval fixtures outside the repo (`bash evals/fixtures/build.sh <temp dir>`): sandboxed agents cannot create nested `.git` dirs inside it.

<!-- project-phase:start -->
## Project phase: STABILIZE (since 2026-11-04)
Goal: turn the prototype into something safe to run for real users. Structural work is expected now.
- Work from the plan in `.ai/debt.md` (audit gaps are open items there, prioritized with the user), in small verifiable steps.
- Before refactoring a flow, pin its current behavior with tests. Cover the core user flows.
- Add structure where it pays off: module boundaries, config out of code, real duplication removed. No rewrite to an ideal architecture.
- Robust error handling at boundaries: input validation, external calls, persistence, auth.
- Set up the basics if missing: CI with tests, lint/format, env config, logging, migrations, pinned dependencies.
- Proactive suggestions are welcome, as a prioritized list with impact and effort.
- Decide what is public (API, schema, URLs) and start keeping it stable.
- Resolve or explicitly accept each item in `.ai/debt.md`.
- Each skill's `description` stays under 1024 characters.
- Bump a skill's version in its `SKILL.md` and its plugin's version in `.claude-plugin/plugin.json` together.
- Guides in `docs/` describe only behavior already in the skill texts.
This contract wins over generic coding-style instructions where they conflict. Explicit user requests override it for that task. Never relaxed: no secrets in code or logs, no destructive operations without confirmation, say what is untested.
If the phase looks wrong for the work being asked, ask the user once, unless `.ai/phase.md` history already confirms it for that reason; never change it yourself.
State: `.ai/phase.md` · Debt: `.ai/debt.md` · Details: `project-phase` skill.
<!-- project-phase:end -->

<!-- work-journal:start -->
## Work journal and handoff
- Design decisions: `docs/design.md`, one section per topic.
- Tasks: none (follow-ups go in the final message).
- Before starting: read `.ai/handoff/<branch>.md` for the current branch (`/` in the name → `-`) if it exists, and the last entries of the newest journal file (`ls .ai/journal | tail -n 1`), then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · branch · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff/<branch>.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context. Never touch other branches' handoffs.
- When the branch's task is done: suggest `/finish` and wait; it checks the work, closes the task and integrates the branch the way the user names. Only if the user wants it closed without `/finish`: move decisions and dead ends that must outlast it to code comments or the design decisions above, close the branch's task, add follow-ups and open questions as new tasks, then delete its handoff.
- Project state goes in these files, not in your tool's private memory. Point to files and commits instead of copying content. Never write secrets, tokens or personal data (tasks may name an assignee by team handle).
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
