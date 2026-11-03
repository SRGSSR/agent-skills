# Phase catalog

Each phase has: what it optimizes for, when it fits, behavior per dimension, typical agent mistakes, and the contract block to copy into `AGENTS.md`.

- [explore](#explore)
- [prototype](#prototype)
- [stabilize](#stabilize)
- [production](#production)
- [maintenance](#maintenance)
- [sunset](#sunset)
- [Common footer](#common-footer)

Dimensions used throughout: **scope** (how far beyond the request the agent may go), **structure** (abstraction, layering, generalization), **tests**, **errors** (error handling and edge cases), **dependencies**, **setup** (CI, lint, containers, config, scaffolding), **docs**, **questions** (how to handle ambiguity), **suggestions** (unsolicited advice), **debt**, **refactoring**, **compatibility** (APIs, data, config), **reporting** (end-of-task message).

---

## explore

Optimizes for: answering a question (is it feasible? which library? how fast?). The code is disposable; the output is the learning.

Fits when: spikes, feasibility checks, comparing approaches, notebooks and scratch scripts, "can we even do X".

- **Scope:** the least code that answers the question.
- **Structure:** none. One file or a scratch script is fine.
- **Tests:** none. Run it and look at the result.
- **Errors:** ignore unless they hide the answer.
- **Dependencies:** anything that gets to the answer faster.
- **Setup:** none.
- **Docs:** none, except the findings note.
- **Questions:** make reasonable assumptions and state them; ask only if the question itself is unclear.
- **Suggestions:** nothing about code quality. Do flag findings that change the answer: hard limits, licensing problems, surprising costs.
- **Debt:** not tracked. The code is not meant to survive.
- **Refactoring:** pointless. Rewrite if needed.
- **Compatibility:** irrelevant.
- **Reporting:** a short findings note: what works, what does not, numbers if relevant, recommendation (drop, or rewrite properly in prototype). Save it where the project keeps design decisions (named in the `work-journal` block, if any), or in the README: the final message alone gets lost.

Typical mistakes: creating a package structure, adding tests, polishing code that will be thrown away, evolving spike code into the product instead of rewriting it.

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: EXPLORE (since YYYY-MM-DD)
Goal: answer a question fast. The code is disposable; the output is the learning.
- Write the least code that answers the question. One file or a scratch script is fine.
- Hardcode freely. Skip tests, error handling, structure, docs and tooling.
- Use any library that gets to the answer faster.
- No advice about code quality. Do flag findings that change the answer (limits, blockers, costs, licensing).
- Finish with a short findings note (what works, what does not, recommendation), saved with the project's design decisions or in the README.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## prototype

Optimizes for: a working end-to-end version to validate the idea with users or stakeholders. Speed of iteration over code quality.

Fits when: MVPs, demos, pilots with a handful of friendly users, early product discovery, a new direction for an old repo.

- **Scope:** exactly what is asked, the simplest way that works. No unrequested files, layers, configs or setup.
- **Structure:** no premature abstraction. Duplicate until the third use, inline values, flat files. Follow the framework's defaults rather than inventing an architecture.
- **Tests:** only when asked, or when a quick test is faster than checking by hand (tricky parsing, calculations).
- **Errors:** the happy path plus the failures that would break the demo.
- **Dependencies:** prefer well-known libraries and framework features over custom code. Don't build what a library already gives.
- **Setup:** only what is needed to run it. No CI, Docker, lint configs, env layering or monitoring unless asked.
- **Docs:** how to run it, in a few lines.
- **Questions:** pick sensible defaults and state them in one line instead of asking. Ask only when a wrong guess would waste real work.
- **Suggestions:** none unsolicited. Mention only blockers, in one line: a security hole if the thing is exposed, risk of losing data the user cares about, or a choice that makes the next step a dead end.
- **Debt:** log deliberate significant shortcuts as one line in `.ai/debt.md` (stubbed auth, no input validation, in-memory storage, single-tenant assumption). Not every hardcoded value.
- **Refactoring:** rewriting a piece wholesale is fine and often cheaper than patching it.
- **Compatibility:** break freely. Resetting a dev database is fine, but confirm before destroying data the user may care about.
- **Reporting:** one to three lines: what was done and how to try it.

Typical mistakes: repository/service/controller layers for three endpoints, config systems, generic "reusable" components used once, a test suite nobody asked for, Dockerfile and CI on day one, five clarifying questions before writing a line, a closing list of "next steps you should consider".

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: PROTOTYPE (since YYYY-MM-DD)
Goal: a working end-to-end version to validate the idea. Speed of iteration over code quality.
- Build exactly what is asked, the simplest way that works. No unrequested files, layers, configs or setup.
- No premature abstraction: duplicate until the third use, inline values, flat structure is fine.
- Tests only when asked, or when quicker than checking by hand.
- Handle the happy path and failures that would break the demo; nothing more.
- Prefer framework defaults and well-known libraries over custom code. Rewriting a piece is fine.
- Pick sensible defaults instead of asking; state them in one line.
- No unsolicited advice. Mention only blockers, in one line: security holes if exposed, data loss, dead ends.
- Log deliberate significant shortcuts (stubbed auth, no validation, in-memory store) as one line in `.ai/debt.md`.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## stabilize

Optimizes for: turning a prototype into something safe to run for real users. This is the phase where the agent's instinct for structure is welcome, channeled through a plan.

Fits when: the idea is validated and a launch, pilot with real data, or handover to another team is coming.

- **Scope:** systematic, but plan-driven: audit, prioritized list agreed with the user and kept as open items in `.ai/debt.md`, small verifiable steps. Not "fix everything at once".
- **Structure:** introduce structure where it pays off: clear module boundaries, config out of code, real duplication removed. Not a rewrite to an idealized architecture.
- **Tests:** before refactoring a flow, pin its current behavior with tests. Cover the core user flows.
- **Errors:** robust at the boundaries: input validation, external calls, persistence, auth.
- **Dependencies:** review: pin versions, remove unused ones, check known vulnerabilities and licenses.
- **Setup:** add the basics if missing: CI running tests, lint/format, environment-based config, logging, migrations, a reproducible way to run and deploy.
- **Docs:** setup and run instructions, a short architecture overview, operational notes.
- **Questions:** ask about priorities and trade-offs; this phase has real choices.
- **Suggestions:** proactive and welcome, as a prioritized list with impact and rough effort.
- **Debt:** resolve or explicitly accept every item in `.ai/debt.md`.
- **Refactoring:** yes, behind tests, in small steps, separate from behavior changes.
- **Compatibility:** decide what is public (API, schema, URLs, file formats) and start keeping it stable.
- **Reporting:** what changed, what is now covered by tests, what remains on the plan.

Typical mistakes: rewriting everything in one go, refactoring without tests first, gold-plating (perfect architecture instead of safe-to-run), ignoring the existing debt list.

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: STABILIZE (since YYYY-MM-DD)
Goal: turn the prototype into something safe to run for real users. Structural work is expected now.
- Work from the plan in `.ai/debt.md` (audit gaps are open items there, prioritized with the user), in small verifiable steps.
- Before refactoring a flow, pin its current behavior with tests. Cover the core user flows.
- Add structure where it pays off: module boundaries, config out of code, real duplication removed. No rewrite to an ideal architecture.
- Robust error handling at boundaries: input validation, external calls, persistence, auth.
- Set up the basics if missing: CI with tests, lint/format, env config, logging, migrations, pinned dependencies.
- Proactive suggestions are welcome, as a prioritized list with impact and effort.
- Decide what is public (API, schema, URLs) and start keeping it stable.
- Resolve or explicitly accept each item in `.ai/debt.md`.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## production

Optimizes for: shipping features to real users without breaking them, while keeping the codebase easy to evolve.

Fits when: the product is live and actively developed.

- **Scope:** what the task needs. Small cleanups only inside code already being touched (boy scout rule, kept small and safe). Larger refactors are proposed, not done, and kept separate from feature work.
- **Structure:** follow the existing patterns and conventions, even if you would design it differently. New abstractions only when they pay off now (second or third real use).
- **Tests:** new code gets tests. Every bug fix gets a regression test. Keep the suite green.
- **Errors:** full handling: validation, logging, meaningful user-facing messages.
- **Dependencies:** add only with a reason; prefer what is already in use.
- **Setup:** use what exists. Don't change CI, build or config unprompted.
- **Docs:** update docs and changelog affected by the change.
- **Questions:** ask when ambiguity affects users, data or public interfaces; otherwise follow existing conventions.
- **Suggestions:** at the end of a task, up to three short structural observations relevant to the area touched: problem, impact, rough effort. Don't implement them unasked. No suggestions about code you did not look at. If the user wants to keep one, record it as a task (if the project keeps tasks) or in `.ai/debt.md`.
- **Debt:** record debt you find in `.ai/debt.md`. When a task touches an area with known debt, mention it.
- **Refactoring:** incremental, separate commits or PRs from features.
- **Compatibility:** backward compatible by default. Schema changes need migrations. Breaking changes need explicit approval. Consider feature flags for risky changes if the project uses them.
- **Reporting:** what changed, tests added and run, risks, then the optional observations.

Typical mistakes: introducing a new pattern next to the established one, reformatting files while adding a feature, mixing a refactor into a feature diff, ten suggestions after every task, breaking an API "because it's cleaner".

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: PRODUCTION (since YYYY-MM-DD)
Goal: ship features to real users without breaking them, keeping the codebase easy to evolve.
- Follow existing patterns and conventions. New abstractions only when they pay off now.
- Change what the task needs. Small cleanups only inside code you are already touching; propose larger refactors, keep them separate from features.
- New code gets tests; every bug fix gets a regression test. Keep the suite green.
- Backward compatible by default (APIs, data, config). Schema changes need migrations; breaking changes need explicit approval.
- Add dependencies only with a reason; prefer what is already in use. Update affected docs and changelog.
- At the end of a task you may add up to 3 short structural observations about the area touched (problem, impact, effort). Don't implement them unasked; if the user wants to keep one, record it as a task or in `.ai/debt.md`.
- Record tech debt you find in `.ai/debt.md`; mention known debt when a task touches that area.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## maintenance

Optimizes for: keeping it working. Zero regressions; every change surgical.

Fits when: the product is stable and valued, with no active feature development; fixes, security patches and small adjustments only.

- **Scope:** the smallest diff that fixes the specific issue. Nothing else: no renames, reformatting, import sorting, comment cleanup, type annotations or "while I'm here" changes. Every changed line must be explainable by the fix.
- **Root cause:** fix it at the root only when that diff is also minimal and no other caller changes behavior. If the root fix would change other callers (even ones with the same bug), fix the reported path and note the others in `.ai/debt.md`: changing them is a decision for the user.
- **Structure:** match the surrounding code style, even if outdated. No new abstractions or patterns. Copy the style, not the defects: new code must not repeat a behavior you recognize as a bug (silently ignoring invalid input, charging the full amount); flag the existing one instead.
- **Tests:** reproduce the bug with a failing test first where feasible. Run the existing suite before and after.
- **Errors:** fix the failing path; don't redesign error handling around it.
- **Dependencies:** no changes unless the fix or a security patch requires them; prefer the smallest version bump.
- **Setup:** don't touch.
- **Docs:** changelog or release note for the fix.
- **Questions:** ask when the expected behavior is ambiguous; a wrong guess here is a regression.
- **Suggestions:** only about security, data loss or imminent breakage.
- **Debt:** note problems you see in `.ai/debt.md` and mention them in one line at the end. Don't fix them.
- **Refactoring:** none, unless the refactor is the fix and the user agreed.
- **Compatibility:** behavior stays identical except for the fix. Never change public interfaces, data formats or config semantics.
- **Reporting:** what changed, why it is safe (the scope of the diff, the tests run), anything noticed but left alone.

Typical mistakes: "modernizing" code near the fix, upgrading a dependency to fix a warning, fixing two other bugs noticed on the way, renaming a confusing variable, adding a helper "for future use".

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: MAINTENANCE (since YYYY-MM-DD)
Goal: keep it working. Zero regressions; every change surgical.
- Smallest diff that fixes the specific issue. Touch nothing else: no renames, reformatting, cleanup or "while I'm here" changes.
- Fix at the root only if no other caller changes behavior; otherwise fix the reported path and note the other callers in `.ai/debt.md`.
- Match the surrounding code style, even if outdated. No new abstractions or patterns. Copy the style, not known defects.
- Reproduce bugs with a failing test first where feasible; run the existing suite before and after.
- Behavior stays identical except for the fix. Never change public interfaces, data formats or config semantics.
- No dependency changes unless the fix or a security patch requires them; smallest version bump.
- Ask when expected behavior is ambiguous: a wrong guess is a regression.
- Other problems you notice: one line in `.ai/debt.md` and one line in your report. Don't fix them.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## sunset

Optimizes for: winding down safely and helping users move off.

Fits when: the project is deprecated, replaced or scheduled for shutdown.

- **Scope:** only critical fixes (security, data integrity, outages) and migration or export support.
- **Everything else** (features, refactors, upgrades): point out the phase and ask for confirmation before starting.
- **Other dimensions:** as in maintenance.
- **Docs:** keep deprecation notices, timeline and migration guide accurate.
- **Suggestions:** only about migration and risk.

Contract block:

```markdown
<!-- project-phase:start -->
## Project phase: SUNSET (since YYYY-MM-DD)
Goal: wind down safely and help users move off.
- Only critical fixes (security, data integrity, outages) and migration or export support.
- For anything else (features, refactors, upgrades), point out the phase and ask for confirmation before starting.
- As in maintenance: smallest diff, match existing style, no unrelated changes; never change public interfaces, data formats or dependencies unless the fix requires it.
- Keep deprecation notices, timeline and migration guide accurate.
- No suggestions beyond migration and risk.
{{COMMON FOOTER}}
<!-- project-phase:end -->
```

---

## Common footer

Replace `{{COMMON FOOTER}}` in every block with these lines. Add area overrides and custom rules (from `phase.md`) just above them, if any.

```markdown
This contract wins over generic coding-style instructions where they conflict. Explicit user requests override it for that task. Never relaxed: no secrets in code or logs, no destructive operations without confirmation, say what is untested.
If the phase looks wrong for the work being asked, ask the user once, unless `.ai/phase.md` history already confirms it for that reason; never change it yourself.
State: `.ai/phase.md` · Debt: `.ai/debt.md` · Details: `project-phase` skill.
```
