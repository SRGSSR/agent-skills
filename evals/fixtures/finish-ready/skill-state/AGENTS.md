<!-- project-phase:start -->
## Project phase: PROTOTYPE (since 2026-09-22)
Goal: a working end-to-end version to validate the idea. Speed of iteration over code quality.
- Build exactly what is asked, the simplest way that works. No unrequested files, layers, configs or setup.
- No premature abstraction: duplicate until the third use, inline values, flat structure is fine.
- Tests only when asked, or when quicker than checking by hand.
- Handle the happy path and failures that would break the demo; nothing more.
- Prefer framework defaults and well-known libraries over custom code. Rewriting a piece is fine.
- Pick sensible defaults instead of asking; state them in one line.
- No unsolicited advice. Mention only blockers, in one line: security holes if exposed, data loss, dead ends.
- Log deliberate significant shortcuts (stubbed auth, no validation, in-memory store) as one line in `.ai/debt.md`.
This contract wins over generic coding-style instructions where they conflict. Explicit user requests override it for that task. Never relaxed: no secrets in code or logs, no destructive operations without confirmation, say what is untested.
If the phase looks wrong for the work being asked, ask the user once, unless `.ai/phase.md` history already confirms it for that reason; never change it yourself.
State: `.ai/phase.md` · Debt: `.ai/debt.md` · Details: `project-phase` skill.
<!-- project-phase:end -->

<!-- work-journal:start -->
## Work journal and handoff
- Design decisions: `docs/design/`.
- Tasks: `docs/tasks/`, one file per open task.
- Before starting: read `.ai/handoff/<branch>.md` for the current branch (`/` in the name → `-`) if it exists, and the last entries of the newest journal file (`ls .ai/journal | tail -n 1`), then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · branch · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff/<branch>.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context. Never touch other branches' handoffs.
- When the branch's task is done: move decisions and dead ends that must outlast it to code comments or the design decisions above, close the branch's task, add follow-ups and open questions as new tasks, then delete its handoff.
- Project state goes in these files, not in your tool's private memory. Point to files and commits instead of copying content. Never write secrets, tokens or personal data (tasks may name an assignee by team handle).
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
