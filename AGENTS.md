# Project phase & work journal skills

Open-source Agent Skills: `skills/project-phase/` and `skills/work-journal/`. Eval fixtures, cases and grader in `evals/`.

<!-- work-journal:start -->
## Work journal and handoff
- Before starting: if `.ai/handoff.md` exists, read it and the last entries of the newest file in `.ai/journal/`, then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context.
- Point to files and commits instead of copying content. Never write secrets, tokens or personal data in these files.
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
