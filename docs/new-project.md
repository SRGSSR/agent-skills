# New project

For a repo that is empty or a few days old, where you want to try an idea quickly. The example is a small web app that lists items.

## 1. Before you start (optional)

Install the skills ([Install](../README.md#install)). If you want the same defaults in every project, add them to your global agent instructions (for example `~/.claude/CLAUDE.md`):

```
project-phase set: simple
project-phase: ask
```

- `project-phase set: simple` uses the set prototype → production → maintenance without asking. Without it, setup proposes `standard` (with stabilize between prototype and production).
- `project-phase: ask` makes the agent ask for the phase before the first code change in any repo that has none. Without it, the phase is set up only when you ask.

## 2. Set the phase

Ask the agent:

> Set up the project phase for this repo.

The agent looks at a few cheap signals (file listing, README, git log, CI, tests, deploy files), proposes a phase and a set with two or three lines of reasoning, and waits for you to confirm. For a new repo the proposal is usually `prototype`. Choose:

- **`explore`** if the code is disposable and the output is an answer ("can we parse these feeds fast enough?"). It is in the `full` set or in a `custom` one.
- **`prototype`** if you are building a first working version to validate the idea.
- **`production`** if the repo is new but the product is not: a rewrite of a live service has real users from day one.

After you confirm, the agent writes:

| File | What |
|---|---|
| `AGENTS.md` | The contract block, about 15 lines, loaded on every task |
| `CLAUDE.md` | `@AGENTS.md` near the top, only if `CLAUDE.md` exists (Claude Code reads `AGENTS.md` only without a `CLAUDE.md`) |
| `.ai/phase.md` | Set, current phase, area overrides, custom rules, history |
| `.gitattributes` | `.ai/debt.md merge=union`, so two branches adding debt never conflict |

`.ai/phase.md` looks like this:

```markdown
# Project phase

Phase set: standard (prototype → stabilize → production → maintenance)
Current: prototype (since 2026-11-04)

## Area overrides

## Custom rules

## History
- 2026-11-04: set to prototype (setup). New repo, validating the idea with two pilot users.
```

`.ai/debt.md` is created only when the first shortcut is logged.

## 3. Set up the journal

> Set up the work journal.

The agent adds its block to `AGENTS.md` (about 9 lines) and the line `.ai/journal/*.md merge=union linguist-generated=true` to `.gitattributes`. It asks where two things go, because a new repo has nothing to detect:

- **Design decisions**, the why behind the code: `docs/design/` (one file per decision), a single `docs/decisions.md` for a small project, or none (code comments, commit messages, README).
- **Tasks**, open work and open questions: `docs/backlog/` (one file per task), GitLab or GitHub issues (through `glab` or `gh`) or another tracker with a connector, or none (follow-ups go in the agent's final message).

The answer becomes the first two lines of the block, for example:

```markdown
- Design decisions: `docs/design/`.
- Tasks: `docs/backlog/`, one file per open task.
```

The folders are created by the first file, not at setup. For a quick prototype, `none` for both is a fine start: you can change the two lines later.

You don't have to ask for the setup: the first time the agent writes a journal entry in a repo without the block (for example when you say "let's stop here"), it sets the journal up and asks about decisions and tasks in its final message.

`.ai/` is meant to be committed, so the handoff travels with the repo. To keep the journal private, add `.ai/journal/` to `.gitignore` and keep `.ai/handoff/` committed.

## 4. Working in prototype

What changes compared to an agent without the skills:

- It builds what you ask, the simplest way that works: no extra layers, configs, test suites or CI you didn't ask for.
- It picks sensible defaults instead of asking, and states them in one line.
- No list of "improvements you should consider". It mentions only blockers: security holes if exposed, data loss, dead ends.
- Deliberate shortcuts that would hurt later get one line in `.ai/debt.md`:

  ```markdown
  - [open] 2026-11-04 · `src/auth/` · Auth stubbed: any email logs in. Fix before real users.
  ```

The phase sets defaults, not prohibitions: "add tests for the export" gets you tests. Three rules hold in every phase: no secrets in code or logs, no destructive operations without confirmation, an honest account of what is untested.

The journal stays light in explore and prototype: entries only for decisions, dead ends and the end of a session.

## 5. Pausing and resuming

> Let's stop here, I'll continue tomorrow.

The agent writes `.ai/handoff/<branch>.md` (for `main`: `.ai/handoff/main.md`): goal, status, next steps, decisions, dead ends, open questions, how to verify. It is written for a reader with zero context, so the next session can be another tool or model.

> Where were we?

The agent reads the handoff and the last journal entries, checks them against git (new commits, merges, uncommitted files), says in one or two lines what it is resuming, and continues. If something changed the plan, or the handoff has open questions for you, it asks first.

Write the handoff before you need it: on long tasks the agent also rewrites it at milestones and when the context is getting long, so a crash or an exhausted quota still leaves a usable state.

## 6. When a piece of work is done

When nothing is left for the agent on a branch, it closes the loop instead of leaving a stale handoff:

1. Decisions and dead ends that matter beyond the branch go to code comments or the design decisions.
2. The branch's task file is deleted (merging the branch closes the task); follow-ups and open questions become new tasks.
3. The handoff is deleted, and a journal entry says what was done and moved.

## Next

When the prototype gets real users, a launch date or a pilot, move to the next phase: see [Changing phase](phase-changes.md).
