---
name: project-phase
description: Sets and applies the project's lifecycle phase (explore, prototype, stabilize, production, maintenance, sunset) so the agent works the way that phase needs - no over-engineering or unsolicited advice while prototyping, structural suggestions and tech-debt tracking in production, minimal regression-safe diffs in maintenance. Use this skill whenever the user wants to set up, check or change the project phase, mode or stage; says things like "we're just prototyping", "it's a quick POC", "this is live now", "maintenance only", "stop over-engineering", "don't touch anything else"; asks whether the project is ready for production; or wants to review tech debt or shortcuts. Also use it when AGENTS.md or CLAUDE.md contains a project-phase block and it is unclear how the phase applies to the current request.
license: MIT
metadata:
  version: "0.1.0"
---

# Project Phase

The right way to write code depends on where a project is in its life. A prototype needs speed and zero ceremony. A live product needs tests, compatibility and an eye on tech debt. A system in maintenance needs the smallest possible diff. AI agents tend to apply "large project best practices" everywhere: full scaffolding on day one, early generalization, improvement suggestions nobody asked for. Or the opposite: casual sweeping edits in code that must not regress.

This skill makes the phase explicit and gives the agent a behavior contract for it.

## How it works

Two pieces, both plain Markdown in the repo, readable by any agent or human:

1. **Contract block** - about 15 lines between `<!-- project-phase:start -->` and `<!-- project-phase:end -->` in `AGENTS.md` (and loaded from `CLAUDE.md`). Agent tools load these files on every task, so the phase shapes all work even when this skill is not loaded. This is the part that matters day to day, which is why it must stay short.
2. **State files** in `.ai/`:
   - `phase.md` - phase set, current phase, area overrides, custom rules, history.
   - `debt.md` - one-line register of deliberate shortcuts and tech debt.

This skill manages those files: setup, status, phase changes, debt reviews, and interpreting the phase in unclear cases.

## Principles that hold in every phase

- **The phase sets defaults, not prohibitions.** An explicit request from the user wins for that task. Do it without lecturing. If the user keeps overriding the contract in the same direction, the phase is probably wrong: say so once.
- **Some things are never relaxed:** no secrets in code, commits or logs; no destructive operations (data, history, infrastructure) without confirmation; honest reporting of what is untested or incomplete. Speed is never a reason to hide a known risk.
- **Never change the phase on your own.** When signals suggest it no longer fits, mention it once in one line and continue under the current phase.
- **Process cost follows the phase.** In explore and prototype, even this skill's bookkeeping stays minimal: one-line debt entries, no reports.

## Phases

| Phase | Optimizes for | Agent stance in one line |
|---|---|---|
| `explore` | Answering a question | Disposable code, the output is the learning |
| `prototype` | Validating the idea fast | Simplest thing that works, no unsolicited advice |
| `stabilize` | Getting safe for real users | Structural work expected: tests, CI, config, error handling |
| `production` | Shipping without breaking | Follow patterns, test new code, occasional structural suggestions, track debt |
| `maintenance` | Zero regressions | Smallest diff, touch nothing else, note issues instead of fixing them |
| `sunset` | Winding down safely | Only critical fixes and migration support |

Full behavior per phase, the contract blocks to copy, and typical mistakes: [references/phases.md](references/phases.md).

### Phase sets (presets)

Not every team needs six phases. The set is chosen at setup and stored in `phase.md`:

- `simple`: prototype → production → maintenance
- `standard` (default): prototype → stabilize → production → maintenance
- `full`: explore → prototype → stabilize → production → maintenance → sunset
- `custom`: any subset of the catalog, plus optional project-defined phases

If the user's global instructions name a default set (for example `project-phase set: simple`), use it without asking. With `simple`, there is no stabilize phase, so its checklist runs as part of the prototype → production transition.

## Workflows

### Setup (first use in a project)

1. **Check for existing state.** If `.ai/phase.md` or a contract block exists, show status instead of starting over.
2. **Read the signals** cheaply: top-level listing, README, `git log --oneline | head -20`, commit count and age, CI config, tests, deploy files, version and tags, CHANGELOG. The signal table is in [references/transitions.md](references/transitions.md#detecting-the-phase). Do not read the source tree for this.
3. **Propose, then ask.** Recommend a phase set and a current phase with two or three lines of reasoning, and ask the user to confirm. Signals only suggest: the phase reflects what the team wants to optimize now, not just repo age. A new repo can be production on day one (a rewrite of a live service); an old one can be back in prototype for a new direction. If parts of the repo clearly differ (an experiments folder, a frozen legacy module), propose area overrides.
   Also propose up to three **project-specific rules** that the generic contract cannot know but the signals reveal, especially where a mistake would be costly. For example: migrations that already ran must never be edited; old mobile app versions keep calling the API, so responses only grow; a folder is generated and must not be edited by hand. Only rules grounded in what you read, one line each. Generic best practices don't belong here.
4. **Write the files:**
   - `.ai/phase.md` from the template below, with the accepted project-specific rules under `## Custom rules`.
   - The contract block for the chosen phase, copied from `references/phases.md`, with the date filled in and the accepted project-specific rules added as bullets just above the footer, into `AGENTS.md`. Create `AGENTS.md` if missing; otherwise insert the block near the top, leaving existing content untouched.
   - Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md`. So if `CLAUDE.md` exists and does not already import it, add a line `@AGENTS.md` near the top. Never duplicate the block in both files.
   - Do not create `.ai/debt.md` yet. It is created on first entry.
5. **Report** in two or three lines: phase, set, files touched.

### Status

Answer from the contract block and `phase.md`: current phase and since when, what it means in practice (three bullets), area overrides, open debt count, and any signals that the phase may no longer fit.

### Changing phase

1. Confirm the target phase with the user, unless they already stated it clearly.
2. Run the transition checklist from [references/transitions.md](references/transitions.md#transition-checklists). Present it as a short prioritized list (must now / should soon / later) and ask what to do now. Some transitions generate real work (prototype → stabilize); others are mostly a change of stance (production → maintenance). Do not start the work without agreement.
3. Update `phase.md` (current phase, history line with date and reason) and replace the contract block with the one for the new phase.
4. If the `work-journal` skill is in use, log the change in the journal.

### Debt review

Read `.ai/debt.md`, group items by area and impact, and propose what to fix, accept or drop, fitted to the phase. In prototype, only blockers for the next milestone matter. In stabilize, everything must be resolved or consciously accepted. In production, propose the two or three items with best impact per effort. In maintenance, only items that threaten stability. Update item status after the user decides.

### When unsure how the phase applies

Load [references/phases.md](references/phases.md) and use the behavior table for the current phase. If the request falls between two readings, choose the one more conservative for the codebase in production and maintenance, and the one cheaper in effort in explore and prototype. In one line, state the assumption you made.

## Area overrides

Parts of a repo can live in a different phase: `experiments/` in explore while the product is in production, a legacy module in maintenance while the rest evolves. Overrides live in `phase.md` and are listed in the contract block with the one-line stance of each phase (taken from the table above), for example:

```
Area overrides (apply the phase of the files you change; strictest wins if a change spans areas):
- `legacy/billing/` → maintenance: smallest diff, touch nothing else, regression test.
- `experiments/` → explore: disposable code, the output is the learning.
```

## Custom rules and phases

Teams can tune a phase without forking the skill. Project-specific rules go under `## Custom rules` in `phase.md` and are appended to the contract block as extra bullets: keep them few, because the block is loaded on every task. A fully custom phase is defined in `phase.md` under `## Custom phase: <name>` with the same shape as the built-in contracts (goal line plus at most 8 bullets); copy it into the block like any other phase.

## Templates

### `.ai/phase.md`

```markdown
# Project phase

Phase set: standard (prototype → stabilize → production → maintenance)
Current: prototype (since 2026-10-02)

## Area overrides
<!-- `path/` → phase: reason -->

## Custom rules
<!-- Optional bullets appended to the contract block. Keep them few. -->

## History
- 2026-10-02: set to prototype (setup). New repo, validating the idea with two pilot users.
```

### `.ai/debt.md`

```markdown
# Tech debt and shortcuts

<!-- One line per item, newest first. Status: open | accepted | fixed -->
- [open] 2026-10-02 · `src/auth/` · Auth stubbed: any email logs in. Fix before real users.
```

One line per item: date, area, what and why it matters. In prototype, log only deliberate shortcuts that would hurt later (stubbed auth, no input validation, in-memory storage, hardcoded credentials placeholder), not every hardcoded value.
