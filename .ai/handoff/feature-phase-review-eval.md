# Handoff
Updated: 2026-11-26 · by: claude-code/claude-opus-5-5
Branch: feature/phase-review-eval · Base: develop · Last commit: see git log · Uncommitted: none
Phase: stabilize

## Goal
An eval for `/project-phase setup` on a project already set up (the Review paragraph of the project-phase skill): it reviews instead of starting over, adds the rule the user asks for, and keeps a rule written by hand only in the AGENTS.md block (not in phase.md), which a rebuild of the block from phase.md would drop. Done when fixture, evals.json entry and grader are in, the eval has been run, and the result is reported (and the skill fixed if the user wants).

## Status
Eval 60 in (ca5b664) and run: with_skill 8/8 and 6/8, without_skill 6/8 (Sonnet). The gap is real but latent: run-2 left the hand-written rule only in the block.

## Next steps
- Waiting for the user: add to the Review paragraph of project-phase SKILL.md the clause of Off step 2 (move bullets that are neither in the contract nor in phase.md to Custom rules, say so), bump project-phase, rerun eval 60 (2 runs).

## Pointers
- Request in the conversation of 2026-11-26, after /finish merge of feature/windows-bash-tool.
