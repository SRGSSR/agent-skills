<!-- work-journal:start -->
## Work journal and handoff
- Design decisions: `docs/design/`.
- Tasks: `docs/backlog/`, one file per open task.
- Before starting: read `.ai/handoff/<branch>.md` for the current branch (`/` in the name → `-`) if it exists, and the last entries of the newest journal file (`ls .ai/journal | tail -n 1`), then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · branch · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff/<branch>.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context. Never touch other branches' handoffs.
- When the branch's task is done: move decisions and dead ends that must outlast it to code comments or the design decisions above, close the branch's task, add follow-ups and open questions as new tasks, then delete its handoff.
- Project state goes in these files, not in your tool's private memory. Point to files and commits instead of copying content. Never write secrets, tokens or personal data (tasks may name an assignee by team handle).
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
