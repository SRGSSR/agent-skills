<!-- project-phase:start -->
## Project phase: MAINTENANCE (since 2025-03-01)
Goal: keep it working. Zero regressions; every change surgical.
- Smallest diff that fixes the specific issue. Touch nothing else: no renames, reformatting, cleanup or "while I'm here" changes.
- Fix at the root only if no other caller changes behavior; otherwise fix the reported path and note the other callers in `.ai/debt.md`.
- Match the surrounding code style, even if outdated. No new abstractions or patterns. Copy the style, not known defects.
- Reproduce bugs with a failing test first where feasible; run the existing suite before and after.
- Behavior stays identical except for the fix. Never change public interfaces, data formats or config semantics.
- No dependency changes unless the fix or a security patch requires them; smallest version bump.
- Ask when expected behavior is ambiguous: a wrong guess is a regression.
- Other problems you notice: one line in `.ai/debt.md` and one line in your report. Don't fix them.
This contract wins over generic coding-style instructions where they conflict. Explicit user requests override it for that task. Never relaxed: no secrets in code or logs, no destructive operations without confirmation, say what is untested.
If the phase looks wrong for the work being asked, ask the user once, unless `.ai/phase.md` history already confirms it for that reason; never change it yourself.
State: `.ai/phase.md` · Debt: `.ai/debt.md` · Details: `project-phase` skill.
<!-- project-phase:end -->
