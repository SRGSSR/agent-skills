<img src=".claude-plugin/icon.png" alt="" width="80" align="right">

# project-phase

Makes your AI coding agent work the way the project's lifecycle phase needs: no over-engineering while prototyping, tests and tech-debt tracking in production, minimal regression-safe diffs in maintenance. Part of [SRG SSR Agent Skills](https://github.com/SRGSSR/agent-skills).

## Install

```bash
claude plugin marketplace add SRGSSR/agent-skills
claude plugin install project-phase@srgssr
```

Other agents (Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, ...):

```bash
npx skills add SRGSSR/agent-skills --skill project-phase
```

Then ask your agent:

> Set up the project phase for this repo.

## Why

AI agents tend to treat every project as a large one: full scaffolding on day one, early generalization, test suites and CI nobody asked for, a list of "improvements you should consider" after every task. That burns tokens and time when you just want to validate an idea.

The opposite also happens. In a mature system that must not regress, the agent "cleans up" code next to the fix, upgrades a dependency, renames things for clarity.

Neither behavior is wrong in itself; it is wrong for the phase. A prototype needs speed. A live product needs tests, compatibility and an eye on tech debt. A system in maintenance needs the smallest possible diff. `project-phase` makes the phase explicit and gives the agent a short behavior contract for it.

## Phases

| Phase | Optimizes for | Agent stance |
|---|---|---|
| 🔭&nbsp;`explore` | Answering a question | Disposable code; the output is the learning |
| 🧪&nbsp;`prototype` | Validating the idea fast | Simplest thing that works, no unsolicited advice, shortcuts logged in one line |
| 🏗️&nbsp;`stabilize` | Getting safe for real users | Structural work expected: tests, CI, config, error handling, from an agreed plan |
| 🚀&nbsp;`production` | Shipping without breaking | Follow existing patterns, test new code, up to 3 structural observations per task, track debt |
| 🛡️&nbsp;`maintenance` | Zero regressions | Smallest diff, touch nothing else, note issues instead of fixing them |
| 🌅&nbsp;`sunset` | Winding down safely | Only critical fixes and migration support |

You don't have to use all six. Pick a set when you set up a project:

| Set | Phases |
|---|---|
| `simple` | prototype → production → maintenance |
| `standard` (default) | prototype → stabilize → production → maintenance |
| `full` | explore → prototype → stabilize → production → maintenance → sunset |
| `custom` | any subset, plus phases you define yourself |

Parts of a repo can have their own phase (area overrides), for example `experiments/` in explore while the product is in production, or a legacy module in maintenance.

The phase sets defaults, not prohibitions: if you explicitly ask for tests in a prototype, you get tests. A few rules are never relaxed in any phase: no secrets in code, no destructive operations without confirmation, honest reporting of what is untested.

## How it works

Setup writes a short contract block into `AGENTS.md`, the instruction file most agent tools load on every task. That is what makes the behavior stick even when the skill itself is not loaded, and what makes it work across tools. State lives in plain Markdown under `.ai/`:

```
AGENTS.md          ← contract block (about 15 lines), loaded on every task
.ai/
├── phase.md       ← phase set, current phase, area overrides, custom rules, history
└── debt.md        ← one-line register of shortcuts and tech debt
```

The skill handles setup, phase changes with transition checklists (for example prototype → stabilize: secrets, auth, validation, tests, CI, ...) and debt reviews. A transition's plan goes into `.ai/debt.md` as `must`, `soon` and `later` items, so it outlives the session.

- **Claude Code** reads `AGENTS.md` only when there is no `CLAUDE.md`. Setup adds `@AGENTS.md` to an existing `CLAUDE.md`.
- **Gemini CLI** reads `GEMINI.md` by default. Add `AGENTS.md` to `context.fileName` in its settings.
- **Tools without skill support** still follow the block in `AGENTS.md`. You only need the skill for setup and phase changes, and you can do those by hand from the files in [`skills/project-phase/references/`](skills/project-phase/references/).

## What to say

Talk to your agent normally, in any language:

| You say | The agent |
|---|---|
| "Set up the project phase for this repo." or `/project-phase setup` | Proposes a phase and a set from repo signals, asks you to confirm, writes the block and `.ai/phase.md` |
| "We're just prototyping, stop over-engineering." | Checks the phase; proposes prototype if it isn't |
| "What phase are we in, and what's in the debt list?" or `/project-phase` | Phase and since when, what it means in practice, overrides, open debt |
| "We're launching next month. Move us to stabilize." | Runs the transition checklist, proposes a prioritized plan, records it in `.ai/debt.md` |
| "Review the tech debt." | Proposes what to fix, accept or drop for the current phase |
| `/project-phase setup` on a project already set up | Shows the current choices, proposes only what the repo signals suggest changing, changes what you confirm |
| `/project-phase off`, `/project-phase on` | Replaces the block with an off marker and keeps `.ai/`, or restores the block |
| `/project-phase help` | The commands and the current settings; in Claude Code, typing `/project-phase` also shows the subcommands |

Optional lines for your global agent instructions (for example `~/.claude/CLAUDE.md`): `project-phase set: simple` sets the default phase set; `project-phase: ask` makes the agent ask for the phase in every repo that has none yet ([details](docs/phase-changes.md#when-the-agent-asks-about-the-phase)).

## Guides

| Situation | Guide |
|---|---|
| A brand-new repo, or one with history, maybe live | [Getting started](docs/getting-started.md) |
| Launch, maintenance, end of life; debt reviews; the agent asking about the phase | [Changing phase](docs/phase-changes.md) |

## Cost

The always-loaded part is the `AGENTS.md` block: about 15 lines.

## With work-journal

`project-phase` works on its own. [`work-journal`](https://github.com/SRGSSR/agent-skills/tree/main/plugins/work-journal) keeps a journal and a handoff per branch; with both installed, phase changes are logged in the journal, the handoff records the phase, and the journal stays lighter in explore and prototype. Details: [Getting started](docs/getting-started.md#with-work-journal).

## Disable or uninstall

Removing the skill does not change how the agent behaves in projects already set up: the block in `AGENTS.md` is loaded on every task with or without the skill.

- **Turn it off in one project:** `/project-phase off` (or ask in words, for example "turn project-phase off here"). The block in `AGENTS.md` is replaced by the one-line marker `<!-- project-phase:off -->`, which also stops the skill from adding the block back on its own. `.ai/` is kept, and `/project-phase on` restores the block. While off, the skill still does what you explicitly ask, once.
- **Remove the plugin:** in Claude Code, `claude plugin disable project-phase@srgssr` (or `uninstall`), or use the `/plugin` menu. With other tools, delete the skill folder. Turn it off in your projects first, or edit `AGENTS.md` by hand as below.
- **By hand:** delete the block between `<!-- project-phase:start -->` and `<!-- project-phase:end -->` in `AGENTS.md`. If the skill is still installed, put the `off` marker in its place, or the skill may add the block back. If setup added `@AGENTS.md` to `CLAUDE.md` only for this block, remove that line too. You can keep `.ai/` as a record or delete it.
- **Less rigor, not none:** changing the phase (for example to `prototype`) is usually what you want instead of turning it off.

## License

MIT. Made by a team at [SRG SSR](https://www.srgssr.ch).
