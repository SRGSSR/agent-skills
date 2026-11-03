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

<!-- work-journal:off -->
