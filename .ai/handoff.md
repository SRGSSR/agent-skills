# Handoff
Updated: 2026-10-02 14:55 · by: claude-code/claude-opus-5-5
Branch: main · Initial commit, not pushed

## Goal
Publish two open-source Agent Skills: `project-phase` (agent behavior adapted to the project's lifecycle phase) and `work-journal` (journal + handoff so work can be resumed by any agent). Done when evals show a clear benefit, the user has reviewed outputs and the open questions below are settled.

## Status
- [x] Skills, README, LICENSE, marketplace.json drafted
- [x] Eval iteration 1 (evals 1-4): with skill 100%, without 81%. `workspace-review/iteration-1.html`
- [x] Eval iteration 2 (evals 3, 5): with skill 100%, without 89%. `workspace-review/iteration-2.html`, archive in `workspace-review/iteration-2/`
- [x] Fixes from iteration 2: setup proposes grounded project rules; maintenance "copy the style, not known defects"
- [x] User feedback on the reports: all cases good, behavior iterations stopped
- [ ] Optional: eval 5 variant without the "stable, billing QA" README hint (the only discriminating maintenance test still missing)
- [ ] Optional: description-trigger optimization (skill-creator `run_loop`)
- [x] Publishing decisions: owner SRG SSR, MIT, names `project-phase` / `work-journal`, state in `.ai/`
- [x] git init + initial commit
- [ ] Push to GitHub (user): README assumes `SRGSSR/srgssr-project-status-skill`

## Next steps
1. When the GitHub repo exists: check that its path matches the install commands in README.md, add the remote, push.
2. Optional, if the user asks: eval 5 variant with a neutral README (`evals/run-prompt.md`), or description optimization.

## Decisions
- English content; MIT, copyright SRG SSR; two skills in one repo, two marketplace entries with `source: "./"` and `skills: [...]`, no plugin.json.
- Only rerun evals affected by a skill change, to save tokens.
- Workspace in the scratchpad (sandbox), results archived in `workspace-review/` so they survive restarts.

## Dead ends
- Fixtures inside the project dir: `.git/` writes are denied by the sandbox.
- Starting servers in the grader: local port binding is denied.
- `/usr/bin/git` and `/usr/bin/python3` shims fail in the sandbox after the OS update: use `/Applications/Xcode.app/Contents/Developer/usr/bin` on PATH and `/opt/homebrew/bin/python3.13`.

## Open questions
- None.

## How to verify
- `claude plugin validate .` passes.
- `node --check evals/grade.mjs`.

## Pointers
- Journal: `.ai/journal/2026-10-02.md`
- Evals: `evals/evals.json`, `evals/fixtures/`, `evals/grade.mjs`, `evals/run-prompt.md`
