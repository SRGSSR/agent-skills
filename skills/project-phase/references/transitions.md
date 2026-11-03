# Detecting and changing phases

- [Detecting the phase](#detecting-the-phase) (setup)
- [Drift signals](#drift-signals) (during normal work)
- [Transition checklists](#transition-checklists)

## Detecting the phase

Gather signals cheaply: top-level listing, README, `git log --oneline | head -20`, `git rev-list --count HEAD`, date of first commit, CI and deploy files, test folders, version and tags, CHANGELOG. Don't read source files for this.

| Phase | Typical signals |
|---|---|
| explore | Few or no commits, scratch scripts or notebooks, no package structure, README missing or says spike / POC / experiment |
| prototype | Weeks old, one or two contributors, no or minimal CI, few tests, version 0.x, README says prototype / MVP / demo, hardcoded config, no production deploy |
| stabilize | Prototype signals plus recent commits adding tests, CI or config; user mentions an upcoming launch, pilot or handover |
| production | Deploy config (Dockerfile, k8s, Terraform, PaaS config), CI running tests, release tags or version ≥ 1.0, CHANGELOG, migrations, monitoring or logging setup, several contributors, steady feature commits |
| maintenance | Production signals, but recent history is mostly fixes and dependency bumps, low commit frequency, patch releases only, README says maintenance mode |
| sunset | Deprecation notice, "replaced by" in README, archived status, shutdown timeline |

Signals suggest; the user decides. The phase is about what the team wants to optimize now. When signals conflict, say which ones and ask.

## Drift signals

During normal work, watch for signs that the phase no longer fits. Before asking, check the history in `.ai/phase.md`: a confirmation for the same reason means don't ask again. Otherwise ask once whether the phase still fits, continue under the current phase, and record the answer (see the skill, "When the phase is not certain").

- **Prototype → stabilize or production:** the user mentions real users, customers, a launch, production data, or asks for auth, security or hardening; repeatedly asks for tests.
- **Production → maintenance:** for a long stretch the only requests are bug fixes and updates; the user says there will be no new features.
- **Maintenance → production:** repeated requests for new features or larger changes.
- **Any phase:** the user overrides the contract three or more times in the same direction.

Example: "This sounds like the app is getting real users. Is it still a prototype, or should we move to stabilize? (`project-phase` can run the checklist.)"

## Transition checklists

Present the relevant checklist as a short prioritized list (must now / should soon / later), adapted to what the repo actually has. Skip items already in place. Agree with the user before starting the work. Record each gap as an open item with its priority in `.ai/debt.md`, so the plan outlives the session (see the skill, "Changing phase").

### explore → prototype

- Write down the findings where the project keeps design decisions, or in the README: what worked, what did not, numbers.
- Decide keep or rewrite. Usually rewrite: spike code carries spike assumptions.
- Choose the stack and the simplest end-to-end slice to build first.

### prototype → stabilize

Also used for prototype → production when the phase set has no stabilize phase; the "must" items then become the first tasks in production.

- Review `.ai/debt.md`: every item gets fix now, fix later or accept.
- Search inline shortcut markers (`TODO`, `FIXME`, the team's own) and add those that matter to `.ai/debt.md`.
- Secrets and config: nothing hardcoded, environment-based config, `.env` ignored.
- Auth and authorization on everything exposed.
- Input validation at all external boundaries.
- Error handling and logging on external calls and persistence.
- Data: real persistence, migrations, backups if the data matters.
- Tests covering the core user flows, written before refactoring them.
- CI running tests; lint and format.
- Dependencies: pinned, unused removed, known vulnerabilities and licenses checked.
- README: setup, run, deploy. Short architecture overview.
- Decide the public surface (API, schema, URLs) that must stay stable from launch.

### stabilize → production

- Every "must" item from the stabilize plan is done or explicitly accepted.
- Deploy and rollback procedure known and tested once.
- Monitoring or at least error alerting in place.
- Public surface documented; changelog started.
- `.ai/debt.md` reflects what was accepted, with reasons.

### production → maintenance

- Confirm the scope of maintenance: fixes only? security updates? small adjustments?
- Make sure the test suite runs reliably; it is the main protection against regressions now.
- Document how to ship a fix (build, release, deploy).
- Mark `.ai/debt.md` items as accepted unless they threaten stability.
- Agree on a dependency and security update policy.

### maintenance → production (reactivation)

- Review `.ai/debt.md` and outdated dependencies before big new features.
- Check that build, CI and deploy still work.
- Propose the few structural updates worth doing first.

### any → sunset

- Deprecation notice in README and, where relevant, in the product.
- Timeline and the replacement, if any.
- Migration guide and data export.
- Decide what still gets fixed (security only? outages?) until shutdown.
- Archive plan: repo, data retention, credentials and infrastructure to revoke.

### Moving backwards

Moving to an earlier phase is legitimate: a product can return to prototype for a new direction. Often an area override is the better fit, so the live parts keep their protection while the new area moves fast.
