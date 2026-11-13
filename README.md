<div align="center">

# 🧭 Project phase & work journal

**Agent Skills that make your AI coding agent work the way your project needs _right now_,<br/>and let any agent, model or human pick up exactly where the last one stopped.**

[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-6E56CF)](https://agentskills.io)
[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-D97757)](#install)
[![project-phase](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSRGSSR%2Fagent-skills%2Fmain%2Fplugins%2Fproject-phase%2F.claude-plugin%2Fplugin.json&query=%24.version&label=project-phase&color=2563eb)](plugins/project-phase/skills/project-phase/SKILL.md)
[![work-journal](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSRGSSR%2Fagent-skills%2Fmain%2Fplugins%2Fwork-journal%2F.claude-plugin%2Fplugin.json&query=%24.version&label=work-journal&color=2563eb)](plugins/work-journal/skills/work-journal/SKILL.md)
[![Evals](https://img.shields.io/badge/evals-with_vs_without-16a34a)](#does-it-make-a-difference)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

Works with **Claude Code**, **Codex**, **Cursor**, **Gemini CLI**, **GitHub Copilot**, **OpenCode** and other tools that read `AGENTS.md`

[Why](#why) · [Install](#install) · [Phases](#phases) · [Work journal](#work-journal) · [Commands](#usage) · [Guides](docs/README.md)

</div>

---

## Why

AI agents treat every project the same way. On a weekend prototype they scaffold layers, CI and a test suite nobody asked for, then close with a list of "improvements you should consider". On a system that must not regress they "clean up" the code next to the fix, bump a dependency, rename things for clarity.

Neither is wrong in itself; it's wrong **for the phase**. And whatever the phase, work gets interrupted: the session ends, the context fills up, the quota runs out, you switch tool. Whatever wasn't written down, the next agent rediscovers the expensive way.

**Same agent, same model, same request.** Only the phase in `AGENTS.md` changes:

> *"Fix the rounding bug in `applyDiscount`."*

| | 🧪&nbsp;`prototype` | 🚀&nbsp;`production` | 🛡️&nbsp;`maintenance` |
|---|---|---|---|
| **Does** | Fixes it the simplest way that works; rewriting the function is fine | Fixes it following the existing patterns and adds a regression test | Reproduces it with a failing test first, then makes the smallest diff that fixes it |
| **Doesn't** | Add a test suite, CI, or a closing list of "next steps you should consider" | Mix a refactor into the fix, or break an API "because it's cleaner" | Rename, reformat, bump dependencies, or change another caller with the same bug: it notes that one in `.ai/debt.md` |
| **Reports** | One to three lines | What changed, tests, risks, up to 3 structural observations | What changed, why it's safe, what it noticed and left alone |

Made by a team at [SRG SSR](https://www.srgssr.ch), the Swiss public broadcaster: we use these skills in our work and share them because they turned out to be useful. This repo is developed with both of them: see its [`AGENTS.md`](AGENTS.md) and [`.ai/`](.ai/).

## What's inside

- 🧭 **[`project-phase`](plugins/project-phase/skills/project-phase/SKILL.md)**: tells the agent which lifecycle phase the project is in (prototype, production, maintenance, ...) and gives it a short behavior contract for it. Runs the checklist when you change phase and keeps a one-line tech-debt register.
- 📓 **[`work-journal`](plugins/work-journal/skills/work-journal/SKILL.md)**: keeps a terse journal and a handoff per branch in the repo, so you can stop at any moment and resume later with another agent, model or tool, or hand over to a colleague.
- 📋 **[`backlog`](plugins/work-journal/skills/backlog/SKILL.md)**: `/backlog` lists the open tasks and suggests what to pick up next; creates, edits, comments on, filters and closes them. Task files, GitHub or GitLab issues, or Jira.
- 🌿 **[`start`](plugins/work-journal/skills/start/SKILL.md)** and **[`finish`](plugins/work-journal/skills/finish/SKILL.md)**: `/start <task>` opens a branch with its first handoff. `/finish merge`, `mr` or `pr` checks that the work is done and documented, then merges it or prepares the merge or pull request.

`backlog`, `start` and `finish` ship with the `work-journal` plugin. The two plugins work independently and fit together when both are installed.

## Does it make a difference?

Every behavior change is checked with [evals](evals/): fixture repos with real git history, each case run on the same repo **with and without** the skills, graded by a script.

The last full run, on 2026-11-03 (skills at 0.4, 15 cases, Claude Sonnet 5.5):

| | Checks passed |
|---|:-:|
| ✅ With the skills | **126 / 126** |
| ➖ Without | 104 / 126 |

On 5 of those 15 cases the model already got everything right on its own; they stay as regression tests. Where the skills made the difference, from this and later runs:

- **Moving a prototype to stabilize:** with the skill, the gaps went into `.ai/debt.md` as `must`, `soon` and `later` items and no code was touched; without, vaguer items and no priorities.
- **A repo with no phase recorded** (with `project-phase: ask` in the global instructions): with the skill, the agent asked, stated the phase it assumed from tags, CI and deploy files, and recorded nothing until answered.
- **"Create the team file":** with the skill, the agent warned that the file holds personal data and looked no one up before you agreed; without, it created the file right away.

The suite has since grown to 44 cases, run as each feature lands.

## Install

### Claude Code

```bash
claude plugin marketplace add SRGSSR/agent-skills
claude plugin install project-phase@srgssr
claude plugin install work-journal@srgssr
```

### Any agent (Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, ...)

With [`skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add SRGSSR/agent-skills
```

Or copy the skill folders, `plugins/project-phase/skills/project-phase/` and the four in `plugins/work-journal/skills/`, into your tool's skills folder (`.agents/skills/` is read by most tools; Claude Code uses `.claude/skills/`).

### Then, in your repo

> *"Set up the project phase for this repo."*

The agent proposes a phase from what it sees (commits, tags, CI, deploy files), asks you to confirm, and writes the block. The journal sets itself up the first time it's needed. Step by step: [New project](docs/new-project.md) · [Project already under way](docs/existing-project.md).

<details>
<summary><b>Tool notes</b> (Claude Code with a <code>CLAUDE.md</code>, Gemini CLI, tools without skill support)</summary>

- **Claude Code** reads `AGENTS.md` only when there is no `CLAUDE.md`. The skills add `@AGENTS.md` to an existing `CLAUDE.md` during setup.
- **Gemini CLI** reads `GEMINI.md` by default. Add `AGENTS.md` to `context.fileName` in its settings.
- **Tools without skill support** still follow the blocks in `AGENTS.md`. You only need the skill for setup and phase changes, and you can do those by hand from the files in `plugins/project-phase/skills/project-phase/references/`.

</details>

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

## Work journal

```text
Mon 17:40   you → Claude Code   "Let's stop here, I'll continue tomorrow."
            ✍️  .ai/handoff/feature-csv-export.md   goal · status · next steps · dead ends

Tue 09:05   you → Codex         "Where were we?"
            📖  reads the handoff and the last journal entries, checks them against git,
                says what it's resuming, starts on the next step
```

One branch, from task to merge, across as many sessions, tools and people as it takes:

```mermaid
flowchart LR
    A(["/backlog"]) -->|pick a task| B(["/start"])
    B -->|"branch + first handoff"| C["Work<br/>journal entries at checkpoints"]
    C -->|"pause, quota, other tool"| D[("Handoff<br/>.ai/handoff/branch.md")]
    D -->|"“Where were we?”<br/>any agent or model"| C
    C -->|task done| E(["/finish merge · mr · pr"])
```

<details>
<summary><b>What a handoff looks like</b></summary>

```markdown
# Handoff
Updated: 2026-10-02 17:40 · by: claude-code/claude-opus-5-5
Branch: feature/csv-export · Base: develop · Last commit: a1b2c3d · Uncommitted: `src/export.js` (work in progress)
Phase: prototype

## Goal
Users can export the item list as CSV from the list page. Done when the button downloads a file that opens correctly in Excel.

## Status
- [x] `GET /items.csv` endpoint, streams rows
- [~] Excel compatibility: UTF-8 BOM added, separator still wrong for Swiss locale
- [ ] Download button in `views/items.ejs`

## Next steps
1. In `src/export.js`, make the separator configurable (`;` for de-CH); see the comment at `formatRow`.
2. Add the button to `views/items.ejs` next to "New item".

## Dead ends
- `json2csv`: breaks on nested fields. Don't retry without flattening first.

## Open questions
- For the user: should archived items be included?
```

</details>

## How it works

Both skills write a short block into `AGENTS.md`, the instruction file most agent tools load on every task. That is what makes the behavior stick even when the skill itself is not loaded, and what makes it work across tools. State lives in plain Markdown under `.ai/`:

```
AGENTS.md                 ← contract blocks (about 15 + 9 lines), loaded on every task
.ai/
├── phase.md              ← phase set, current phase, area overrides, history
├── debt.md               ← one-line register of shortcuts and tech debt
├── team.md               ← people's handles on each system, roles and nicknames (only if you ask for it)
├── handoff/
│   └── feature-x.md      ← current state of one branch: goal, status, next steps, open questions
└── journal/
    └── 2026-10-02.md     ← append-only log shared by all branches: what was done, decisions, dead ends
```

The skills themselves handle setup, phase changes with transition checklists (for example prototype → stabilize: secrets, auth, validation, tests, CI, ...), debt reviews, and the handoff and resume protocol.

`.ai/` is meant to be committed, so the handoff travels across machines and people; for `.ai/team.md` you choose when you create it. You can ignore `.ai/journal/` if you prefer to keep the log private.

**Teams and long-lived projects.** One handoff per branch, so people on different branches never overwrite each other's state; the journal and the debt list are shared and merge without conflicts (`merge=union`); resuming reads only the newest journal file, so the cost doesn't grow over the years. Details: [Teams and long-lived projects](docs/teams.md).

**Design decisions and tasks.** What outlives a branch goes where people look, not in `.ai/`: **design decisions** (an existing ADR folder, `docs/design/`, `docs/decisions.md`, or code comments and the README) and **tasks** (`docs/backlog/` with one file per open task, GitLab or GitHub issues through `glab` or `gh`, Jira through `acli` or the Atlassian connector, another tracker through a connector, or none). `work-journal` chooses both at setup and names them in its block; `/backlog` lists, filters, creates, edits, comments on and closes tasks, and finds people by nickname through `.ai/team.md`. Details and examples: [Backlog commands](docs/teams.md#backlog-commands).

## Usage

Talk to your agent normally, in any language. For example:

- *"Set up the project phase for this repo."*
- *"We're launching next month. Move us to stabilize."*
- *"Let's stop here, I'll continue tomorrow with another model."* Then, next time: *"Where were we?"*

Each skill also has commands. In Claude Code, typing one shows its subcommands:

| Command | Does |
|---|---|
| `/project-phase` | Phase, since when, open debt |
| `/work-journal` | Where things stand on this branch |
| `/backlog` | Open tasks and what to pick up next |
| `/project-phase setup`, `/work-journal setup` | Sets the skill up, or reviews the choices of a project already set up |
| `/project-phase on`, `off` (same for `/work-journal`) | Turns the skill on or off in one project |
| `/backlog new`, `edit`, `comment`, `close`, `filter` | Creates, edits, comments on, closes or filters tasks |
| `/start <task or name> [context]` | Opens a branch for the task (git flow if the repo uses it), writes its first handoff, offers to assign the task to you |
| `/finish merge`, `/finish merge-request` (`mr`), `/finish pull-request` (`pr`) | Checks that the work is done and documented; then merges, or prepares the merge or pull request |
| `/finish <mode> <instructions>` | The same, following the instructions for this run, e.g. `/finish pr as a draft, reviewer anna` |
| `/finish help` | Shows the modes, the base the branch would go into and what gets checked |
| `help` after any of the three | Its commands and current settings |

Examples of each `/backlog` command: [Backlog commands](docs/teams.md#backlog-commands). More requests, and step-by-step guides for a new project, a project already under way, teams and phase changes: [`docs/`](docs/README.md).

Optional lines for your global agent instructions (for example `~/.claude/CLAUDE.md`): `project-phase set: simple` sets the default phase set; `project-phase: ask` makes the agent ask for the phase in every repo that has none yet ([details](docs/phase-changes.md#when-the-agent-asks-about-the-phase)).

## Cost

The always-loaded part is the `AGENTS.md` blocks: about 15 lines for the phase and 9 for the journal. Journal entries are 2 to 6 lines at checkpoints, and resuming reads only the branch's handoff and the last few entries. In explore and prototype the bookkeeping is reduced further.

## Disable or uninstall

Removing a skill does not change how the agent behaves in projects already set up: the blocks in `AGENTS.md` are loaded on every task with or without the skill.

- **Turn a skill off in one project:** `/project-phase off` or `/work-journal off` (or ask in words, for example "turn project-phase off here"). The block in `AGENTS.md` is replaced by a one-line marker such as `<!-- project-phase:off -->`, which also stops the skill from adding the block back on its own. `.ai/` is kept, and `/project-phase on` or `/work-journal on` restores the block. While off, the skill still does what you explicitly ask, once.
- **Remove the skill:** in Claude Code, `claude plugin disable <name>@srgssr` (or `uninstall`), or use the `/plugin` menu. With other tools, delete the skill folder. Turn it off in your projects first, or edit `AGENTS.md` by hand as below.
- **By hand:** delete the block between `<!-- project-phase:start -->` and `<!-- project-phase:end -->` (or `<!-- work-journal:start -->` and `<!-- work-journal:end -->`) in `AGENTS.md`. If the skill is still installed, put the `off` marker in its place, or the skill may add the block back. If setup added `@AGENTS.md` to `CLAUDE.md` only for these blocks, remove that line too. You can keep `.ai/` as a record or delete it.
- **Less rigor, not none:** for `project-phase`, changing the phase (for example to `prototype`) is usually what you want instead of turning it off.

## Design notes

Why the skills work the way they do, and what was discarded: [Design notes](docs/design.md).

## Related work

- [Cline Memory Bank](https://docs.cline.bot/prompting/cline-memory-bank): project context files read at every task start.
- [andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills): a fixed set of anti-over-engineering guidelines. `project-phase` makes the rigor depend on the phase instead.
- [agent-lifecycle-skills](https://github.com/tosclone1/agent-lifecycle-skills): lifecycle stages for Codex.
- Handoff skills such as [mattpocock/skills handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) and [claude-handoff](https://github.com/REMvisual/claude-handoff).

## Contributing

Issues and pull requests are welcome, especially reports of cases where the agent misread a phase. Please include the phase, the request and what the agent did.

Behavior changes are checked with evals in [`evals/`](evals/): realistic fixture repos with git history (`evals/fixtures/build.sh`), test cases in `evals.json`, a programmatic grader (`grade.mjs`), and the run layout and prompt in `run-prompt.md`. Each case runs with and without the skills on the same repo. Before changing how a skill behaves, read the [design notes](docs/design.md): most alternatives have been tried.

## License

[MIT](LICENSE) © SRG SSR
