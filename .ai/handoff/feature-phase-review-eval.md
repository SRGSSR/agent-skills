# Handoff
Updated: 2026-11-26 · by: claude-code/claude-opus-5-5
Branch: feature/phase-review-eval · Base: develop · Last commit: see git log · Uncommitted: none
Phase: stabilize

## Goal
An eval for `/project-phase setup` on a project already set up (the Review paragraph of the project-phase skill): it reviews instead of starting over, adds the rule the user asks for, and keeps a rule written by hand only in the AGENTS.md block (not in phase.md), which a rebuild of the block from phase.md would drop. Done when fixture, evals.json entry and grader are in, the eval has been run, and the result is reported (and the skill fixed if the user wants).

## Status

## Next steps
- Fixture evals/fixtures/phase-review (prototype-csv-export base, hand-written rule in the block), eval 60, grader.

## Pointers
- Request in the conversation of 2026-11-26, after /finish merge of feature/windows-bash-tool.
