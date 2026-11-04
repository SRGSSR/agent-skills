# Changing phase

How a project moves from one phase to the next, how the agent behaves when the phase looks wrong, and how to switch the skills off.

## Asking for a change

> We're launching next month. Move us to stabilize.

1. The agent confirms the target phase, unless you stated it clearly.
2. It runs the transition checklist, adapted to what the repo already has, and presents the gaps as a short prioritized list: must now, should soon, later. It doesn't start the work until you agree.
3. Each gap becomes an open item in `.ai/debt.md` with its priority, so the plan outlives the session (a stabilize phase takes weeks):

   ```markdown
   - [open] 2026-11-04 · must · `src/auth/` · Auth stubbed: any email logs in.
   - [open] 2026-11-04 · soon · `.github/` · No CI: tests run only by hand.
   - [open] 2026-11-04 · later · `README.md` · No deploy instructions.
   ```

   If the journal has a task list, larger items also become tasks that link the debt item.
4. `.ai/phase.md` gets the new phase and a history line with the date and the reason; the contract block in `AGENTS.md` is replaced with the new phase's block.
5. With the journal in use, the change is logged there.

The agent never changes the phase on its own: only you decide.

## Transitions

| From → to | What the checklist covers |
|---|---|
| explore → prototype | Write down the findings (what worked, what didn't, numbers) with the design decisions or in the README. Decide keep or rewrite: usually rewrite, spike code carries spike assumptions. Choose the stack and the first end-to-end slice. |
| prototype → stabilize | Every debt item gets fix now, fix later or accept. `TODO`/`FIXME` markers that matter go into `.ai/debt.md`. Secrets and config, auth, input validation, error handling and logging, real persistence and backups, tests for the core flows, CI, dependencies, README, the public surface that must stay stable. |
| prototype → production | With the `simple` set there is no stabilize: the same checklist runs here, and its "must" items become the first tasks in production. |
| stabilize → production | Every "must" item done or explicitly accepted. Deploy and rollback tested once, error alerting, public surface documented, changelog started. |
| production → maintenance | Agree on the scope (fixes only? security updates?). A reliable test suite, a documented way to ship a fix, a dependency update policy. Open debt becomes accepted unless it threatens stability. |
| maintenance → production | Review debt and outdated dependencies, check that build, CI and deploy still work, propose the few structural updates worth doing first. |
| any → sunset | Deprecation notice, timeline and replacement, migration guide and data export, what still gets fixed until shutdown, archive plan (repo, data retention, credentials and infrastructure to revoke). |

Moving back to an earlier phase is legitimate, for example a product returning to prototype for a new direction. Often an [area override](existing-project.md#parts-of-the-repo-in-another-phase) fits better: the new area moves fast while the live parts keep their protection.

## Debt review

> Review the tech debt.

The agent groups the items by area and impact and proposes what to fix, accept or drop, fitted to the phase: in prototype only blockers for the next milestone, in stabilize everything resolved or consciously accepted, in production the two or three items with the best impact per effort, in maintenance only what threatens stability. Accepted items stay, with the reason; fixed and dropped ones are deleted.

## When the agent asks about the phase

The phase counts as certain only when it is recorded and consistent: the block in `AGENTS.md` matches `.ai/phase.md`. Repo signals alone never make it certain. The agent asks one question, with its best guess and the reason, in three cases:

- **No phase recorded**, and your global instructions contain `project-phase: ask`. It asks before the first code change, sets up the phase from your answer, and then does what you asked in the first place. If you don't want phases in that repo, it adds the off marker instead.
- **Block and `phase.md` disagree**, or the phase is not in the set. It asks which one holds and rebuilds the block.
- **Signals against the recorded phase**: real users mentioned in a prototype, deploy files and release tags appearing, only fixes for months in production, or you overriding the contract three or more times in the same direction.

If you keep the phase, the answer is recorded as a history line, so the agent doesn't ask again for the same reason:

```markdown
- 2026-11-03: confirmed prototype (asked: deploy files present; still a demo for the pilot team)
```

If you don't answer or say "later", nothing is recorded. The agent continues under the recorded phase (or the one the signals suggest, stating it in one line, for example "Assuming production: release tags and CI") and asks at most once per session.

## Turning the skills off

> /project-phase off

> /work-journal off

You can also ask in words ("turn project-phase off here"). The block in `AGENTS.md` is replaced by a one-line marker such as `<!-- project-phase:off -->`, which also stops the skill from setting itself up again. `.ai/` is kept. While off, the agent still does what you explicitly ask, once, and reminds you in one line that the skill is off. `/project-phase on` and `/work-journal on` restore the blocks; the phase block is rebuilt from `.ai/phase.md`, so bullets you added to it by hand are first moved to its custom rules.

Often you want less rigor rather than none: moving to `prototype` usually fits better than turning `project-phase` off.

To remove a skill altogether, see [Disable or uninstall](../README.md#disable-or-uninstall).
