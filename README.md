# Project phase & work journal skills

Two [Agent Skills](https://agentskills.io) that make AI coding agents behave the way your project needs right now, and let you stop and resume work at any moment, even with a different agent or model.

- **`project-phase`**: tells the agent which lifecycle phase the project is in (prototype, production, maintenance, ...) and what that means for how it works.
- **`work-journal`**: keeps a terse journal and a handoff document in the repo, so any agent or human can pick up where the last one stopped.

They work independently and fit together when both are installed.

## Why

AI agents tend to treat every project as a large one: full scaffolding on day one, early generalization, test suites and CI nobody asked for, a list of "improvements you should consider" after every task. That burns tokens and time when you just want to validate an idea.

The opposite also happens. In a mature system that must not regress, the agent "cleans up" code next to the fix, upgrades a dependency, renames things for clarity.

Neither behavior is wrong in itself; it is wrong for the phase. A prototype needs speed. A live product needs tests, compatibility and an eye on tech debt. A system in maintenance needs the smallest possible diff. `project-phase` makes the phase explicit and gives the agent a short behavior contract for it.

Separately, work with agents gets interrupted all the time: sessions end, context fills up, quotas run out, you switch tools. `work-journal` makes sure what matters is written down where the next agent will find it.

## Phases

| Phase | Optimizes for | Agent stance |
|---|---|---|
| `explore` | Answering a question | Disposable code; the output is the learning |
| `prototype` | Validating the idea fast | Simplest thing that works, no unsolicited advice, shortcuts logged in one line |
| `stabilize` | Getting safe for real users | Structural work expected: tests, CI, config, error handling, from an agreed plan |
| `production` | Shipping without breaking | Follow existing patterns, test new code, up to 3 structural observations per task, track debt |
| `maintenance` | Zero regressions | Smallest diff, touch nothing else, note issues instead of fixing them |
| `sunset` | Winding down safely | Only critical fixes and migration support |

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

Both skills write a short block into `AGENTS.md`, the instruction file most agent tools load on every task. That is what makes the behavior stick even when the skill itself is not loaded, and what makes it work across tools. State lives in plain Markdown under `.ai/`:

```
AGENTS.md                 ← contract blocks (about 15 + 6 lines), loaded on every task
.ai/
├── phase.md              ← phase set, current phase, area overrides, history
├── debt.md               ← one-line register of shortcuts and tech debt
├── handoff.md            ← current state: goal, status, next steps, open questions
└── journal/
    └── 2026-10-02.md     ← append-only log: what was done, decisions, dead ends
```

The skills themselves handle setup, phase changes with transition checklists (for example prototype → stabilize: secrets, auth, validation, tests, CI, ...), debt reviews, and the handoff and resume protocol.

`.ai/` is meant to be committed, so the handoff travels across machines and people. You can ignore `.ai/journal/` if you prefer to keep the log private.

## Install

### Claude Code

```bash
claude plugin marketplace add SRGSSR/srgssr-project-status-skill
```

```bash
claude plugin install project-phase@srgssr-project-status
```

```bash
claude plugin install work-journal@srgssr-project-status
```

### Any agent (Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, ...)

With [`skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add SRGSSR/srgssr-project-status-skill
```

Or copy `skills/project-phase/` and `skills/work-journal/` into your tool's skills folder (`.agents/skills/` is read by most tools; Claude Code uses `.claude/skills/`).

### Tool notes

- **Claude Code** reads `AGENTS.md` only when there is no `CLAUDE.md`. The skills add `@AGENTS.md` to an existing `CLAUDE.md` during setup.
- **Gemini CLI** reads `GEMINI.md` by default. Add `AGENTS.md` to `context.fileName` in its settings.
- **Tools without skill support** still follow the blocks in `AGENTS.md`. You only need the skill for setup and phase changes, and you can do those by hand from the files in `skills/project-phase/references/`.

### Disable or uninstall

Removing a skill does not change how the agent behaves in projects already set up: the blocks in `AGENTS.md` are loaded on every task with or without the skill.

- **Turn a skill off in one project:** `/project-phase off` or `/work-journal off` (or ask in words, for example "turn project-phase off here"). The block in `AGENTS.md` is replaced by a one-line marker such as `<!-- project-phase:off -->`, which also stops the skill from adding the block back on its own. `.ai/` is kept, and `/project-phase on` or `/work-journal on` restores the block. While off, the skill still does what you explicitly ask, once.
- **Remove the skill:** in Claude Code, `claude plugin disable <name>@srgssr-project-status` (or `uninstall`), or use the `/plugin` menu. With other tools, delete the skill folder. Turn it off in your projects first, or edit `AGENTS.md` by hand as below.
- **By hand:** delete the block between `<!-- project-phase:start -->` and `<!-- project-phase:end -->` (or `<!-- work-journal:start -->` and `<!-- work-journal:end -->`) in `AGENTS.md`. If the skill is still installed, put the `off` marker in its place, or the skill may add the block back. If setup added `@AGENTS.md` to `CLAUDE.md` only for these blocks, remove that line too. You can keep `.ai/` as a record or delete it.
- **Less rigor, not none:** for `project-phase`, changing the phase (for example to `prototype`) is usually what you want instead of turning it off.

## Usage

Talk to your agent normally. Examples:

- "Set up the project phase for this repo." The agent reads a few cheap signals (git history, CI, tests, deploy files), proposes a phase and a set, and asks you to confirm.
- "We're just prototyping, stop over-engineering."
- "We're launching next month. Move us to stabilize." The agent runs the transition checklist and proposes a prioritized plan.
- "What phase are we in, and what's in the debt list?"
- "Let's stop here, I'll continue tomorrow with another model." The agent writes the handoff.
- "Where were we?" The agent reads the handoff, checks it against git and continues.

To set a default phase set for all your projects, put a line like `project-phase set: simple` in your global agent instructions (for example `~/.claude/CLAUDE.md`).

## Cost

The always-loaded part is the `AGENTS.md` blocks: about 15 lines for the phase and 6 for the journal. Journal entries are 2 to 6 lines at checkpoints, and resuming reads only the handoff and the last few entries. In explore and prototype the bookkeeping is reduced further.

## Related work

- [Cline Memory Bank](https://docs.cline.bot/prompting/cline-memory-bank): project context files read at every task start.
- [andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills): a fixed set of anti-over-engineering guidelines. `project-phase` makes the rigor depend on the phase instead.
- [agent-lifecycle-skills](https://github.com/tosclone1/agent-lifecycle-skills): lifecycle stages for Codex.
- Handoff skills such as [mattpocock/skills handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) and [claude-handoff](https://github.com/REMvisual/claude-handoff).

## Contributing

Issues and pull requests are welcome, especially reports of cases where the agent misread a phase. Please include the phase, the request and what the agent did.

Behavior changes are checked with evals in [`evals/`](evals/): realistic fixture repos with git history (`evals/fixtures/build.sh`), test cases in `evals.json`, a programmatic grader (`grade.mjs`), and the run layout and prompt in `run-prompt.md`. Each case runs with and without the skills on the same repo.

## License

[MIT](LICENSE)
