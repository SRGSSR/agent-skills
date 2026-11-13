# project-phase

Makes your AI coding agent work the way the project's lifecycle phase needs: no over-engineering while prototyping, tests and tech-debt tracking in production, minimal regression-safe diffs in maintenance. By [SRG SSR](https://www.srgssr.ch).

```bash
claude plugin marketplace add SRGSSR/agent-skills
claude plugin install project-phase@srgssr
```

Then ask your agent: *"Set up the project phase for this repo."* It proposes a phase from the repo's signals, asks you to confirm, and writes a short contract block into `AGENTS.md`, which agent tools load on every task. State lives in `.ai/phase.md` and `.ai/debt.md`.

| Phase | Optimizes for |
|---|---|
| `explore` | Answering a question |
| `prototype` | Validating the idea fast |
| `stabilize` | Getting safe for real users |
| `production` | Shipping without breaking |
| `maintenance` | Zero regressions |
| `sunset` | Winding down safely |

Commands: `/project-phase` (status), `/project-phase setup`, `/project-phase on`, `/project-phase off`, `/project-phase help`.

The skill: [`skills/project-phase/SKILL.md`](skills/project-phase/SKILL.md). Phases, install for other agents, guides and design notes: [SRGSSR/agent-skills](https://github.com/SRGSSR/agent-skills). Works well with [`work-journal`](https://github.com/SRGSSR/agent-skills/tree/main/plugins/work-journal).

MIT licensed.
