<!-- project-phase:start -->
## Project phase: PRODUCTION (since 2025-05-06)
Goal: ship features to real users without breaking them, keeping the codebase easy to evolve.
- Follow existing patterns and conventions. New abstractions only when they pay off now.
- Change what the task needs. Small cleanups only inside code you are already touching; propose larger refactors, keep them separate from features.
- New code gets tests; every bug fix gets a regression test. Keep the suite green.
- Backward compatible by default (APIs, data, config). Schema changes need migrations; breaking changes need explicit approval.
- Add dependencies only with a reason; prefer what is already in use. Update affected docs and changelog.
- At the end of a task you may add up to 3 short structural observations about the area touched (problem, impact, effort). Don't implement them unasked; if the user wants to keep one, record it as a task or in `.ai/debt.md`.
- Record tech debt you find in `.ai/debt.md`; mention known debt when a task touches that area.
This contract wins over generic coding-style instructions where they conflict. Explicit user requests override it for that task. Never relaxed: no secrets in code or logs, no destructive operations without confirmation, say what is untested.
If the phase looks wrong for the work being asked, ask the user once, unless `.ai/phase.md` history already confirms it for that reason; never change it yourself.
State: `.ai/phase.md` · Debt: `.ai/debt.md` · Details: `project-phase` skill.
<!-- project-phase:end -->

<!-- work-journal:start -->
## Work journal and handoff
- Before starting: if `.ai/handoff.md` exists, read it and the last entries of the newest file in `.ai/journal/`, then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context.
- Point to files and commits instead of copying content. Never write secrets, tokens or personal data in these files.
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
