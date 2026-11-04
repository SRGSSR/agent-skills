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
AGENTS.md                 ← contract blocks (about 15 + 9 lines), loaded on every task
.ai/
├── phase.md              ← phase set, current phase, area overrides, history
├── debt.md               ← one-line register of shortcuts and tech debt
├── handoff/
│   └── feature-x.md      ← current state of one branch: goal, status, next steps, open questions
└── journal/
    └── 2026-10-02.md     ← append-only log shared by all branches: what was done, decisions, dead ends
```

The skills themselves handle setup, phase changes with transition checklists (for example prototype → stabilize: secrets, auth, validation, tests, CI, ...), debt reviews, and the handoff and resume protocol.

`.ai/` is meant to be committed, so the handoff travels across machines and people. You can ignore `.ai/journal/` if you prefer to keep the log private.

### Teams and long-lived projects

One handoff per branch, so people on different branches never overwrite each other's state; the journal and the debt list are shared and merge without conflicts (`merge=union`); resuming reads only the newest journal file, so the cost doesn't grow over the years. Details: [Teams and long-lived projects](docs/teams.md).

### Design decisions and tasks

What outlives a branch goes where people look, not in `.ai/`: **design decisions** (an existing ADR folder, `docs/design/`, `docs/decisions.md`, or code comments and the README) and **tasks** (`docs/tasks/` with one file per open task, your issue tracker, or none). `work-journal` chooses both at setup and names them in its block. Details: [Teams and long-lived projects](docs/teams.md#tasks).

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

Talk to your agent normally, in any language. For example:

- "Set up the project phase for this repo."
- "We're launching next month. Move us to stabilize."
- "Let's stop here, I'll continue tomorrow with another model." Then, next time: "Where were we?"

More requests, and step-by-step guides for a new project, a project already under way, teams and phase changes: [`docs/`](docs/README.md).

Optional lines for your global agent instructions (for example `~/.claude/CLAUDE.md`): `project-phase set: simple` sets the default phase set; `project-phase: ask` makes the agent ask for the phase in every repo that has none yet ([details](docs/phase-changes.md#when-the-agent-asks-about-the-phase)).

## Cost

The always-loaded part is the `AGENTS.md` blocks: about 15 lines for the phase and 9 for the journal. Journal entries are 2 to 6 lines at checkpoints, and resuming reads only the branch's handoff and the last few entries. In explore and prototype the bookkeeping is reduced further.

## Design notes

Why the skills work the way they do, and what was discarded. This repo keeps its design decisions here and in code comments (its own `work-journal` block says `Design decisions: none`).

**On / off**
- `off` leaves a one-line marker (`<!-- project-phase:off -->`) instead of just deleting the block: the skills trigger on common phrases and `work-journal` sets itself up on the first journal entry, so a deleted block would come back. Discarded: the off state in `.ai/` (an extra read on every trigger, and `work-journal` has no state file), commenting the block out (it contains HTML comments, which don't nest, and would still cost context), a global switch (uninstalling is that).
- While off, an explicit request is still served once, with a one-line reminder: refusing would be unhelpful, silently turning the skill back on would defeat `off`. `.ai/` is never touched by on/off.
- `project-phase on` rebuilds the block from `.ai/phase.md` like setup does, so `off` first moves hand-added bullets to `## Custom rules`.
- The skills are written in English only, and triggers work in Italian, French and German without examples. Replies follow the user's language (the English skill text pulled replies into English before this was stated); files keep the language they already use. Forcing files to English was discarded: a team writing its journal in German should not get mixed-language files.

**Several people, long-lived projects**
- One handoff per branch, no index file of active work: a file everyone updates is itself a conflict point, and `ls .ai/handoff/` is the index. Deleted when the branch's task is done instead of left in an idle state.
- Journal and debt stay shared, with `merge=union`. Discarded: everything per branch, `.ai/<branch>/` (debt belongs to the code and survives the merge; dead ends recorded on one branch would be invisible to the next); one journal per author (fragmented history, names in files); the journal on a separate branch or in `git notes` (invisible to other tools); periodic summaries of old journals (cost tokens and become a second truth that drifts); year subfolders (`ls .ai/journal | tail -n 1` makes them unnecessary); automatic deletion of old journals.
- The journal header names the branch, not the person: `git log` has the author, and no personal data goes into the files. `linguist-generated` only on the journal, so handoff, phase and debt changes stay visible in pull request reviews.
- Merges done by people are logged at the next resume, in the next commit the agent makes anyway. Discarded: a post-merge git hook (leaves an uncommitted change on `develop`, works only where installed) and a dedicated commit (an extra commit, and on many teams an extra confirmation, for every merge).
- A merge into the branch (`develop` → feature) can make the handoff stale. At resume the agent compares `git diff --stat` of the merge with the files the handoff relies on; reading the whole merge diff every time was discarded as too expensive.
- Not verified: whether GitHub and GitLab merge buttons honor `merge=union`. Local merges do.

**Project phases**
- The contract wins over generic coding-style instructions (global rules, style plugins) where they conflict, because it is the team's choice for one project; explicit user requests still win for a task. Without this line, a global "always fix the root cause" or "no scaffolding" rule and the phase contract were resolved differently each time. Maintenance makes the most common conflict explicit: fix at the root only if no other caller changes behavior.
- The plan of a transition (prototype → stabilize takes weeks) lives in `.ai/debt.md` as open items with a priority (`must`, `soon`, `later`), not only in the conversation. Discarded: the handoff (bound to one branch) and a plan section in `phase.md` (a second list next to the debt).
- Fixed debt items are deleted, not marked: the file stays short, and with `merge=union` two branches changing the same line's status would leave both versions. Accepted items stay, because they record a decision.
- Asking for the phase in repos without one is opt-in (`project-phase: ask` in the global instructions): otherwise every repo without a block would load the skill and get a question, also for people who installed the skill for one project. An unanswered question is not recorded (no "asked, no answer" state to maintain); the agent asks again at most once per session and meanwhile states the phase it assumes. A confirmed phase is a history line, so the next session doesn't ask again for the same signal.
- Explore findings and production observations the user wants to keep go to design decisions, tasks or the debt list: the final message alone gets lost.

**Design decisions and tasks**
- In `docs/` or a tracker, not in `.ai/`: they are written for people and outlive branches, while `.ai/` is the agents' working state. Both are optional, because some teams want no extra folders.
- One file per task with no status field: separate branches touch separate files, and the merge closes the task by deleting its file. Discarded: a single `ROADMAP.md` (every branch edits the same lines; `merge=union` would duplicate edited lines), a status field (git and the branch already say it), the agent assigning tasks on its own.
- Follow-ups and open questions become tasks at the end of a branch, because in the journal nobody finds them again.

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
