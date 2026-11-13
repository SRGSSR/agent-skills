# work-journal

Keeps a terse work journal and a handoff per branch in the repo, so any agent, model or human can pause and resume the work with zero context. Ships with `/backlog`, `/start` and `/finish`. By [SRG SSR](https://www.srgssr.ch).

```bash
claude plugin marketplace add SRGSSR/agent-skills
claude plugin install work-journal@srgssr
```

Then work as usual. *"Let's stop here, I'll continue tomorrow"* writes the branch's handoff in `.ai/handoff/`; *"Where were we?"*, in the same or another tool, reads it, checks it against git and continues. A short block in `AGENTS.md` keeps the protocol active on every task.

| Skill | Commands | Does |
|---|---|---|
| [`work-journal`](skills/work-journal/SKILL.md) | `/work-journal`, `setup`, `on`, `off`, `help` | Journal entries at checkpoints, per-branch handoff, resume |
| [`backlog`](skills/backlog/SKILL.md) | `/backlog`, `new`, `edit`, `comment`, `close`, `filter`, `help` | Open tasks in task files, GitHub or GitLab issues, or Jira; what to pick up next |
| [`start`](skills/start/SKILL.md) | `/start <task or name> [context]` | Opens a branch for a task with its first handoff |
| [`finish`](skills/finish/SKILL.md) | `/finish merge`, `mr`, `pr`, `help` | Checks the work is done and documented, then merges or prepares the merge or pull request |

Install for other agents, guides and design notes: [SRGSSR/agent-skills](https://github.com/SRGSSR/agent-skills). Works well with [`project-phase`](https://github.com/SRGSSR/agent-skills/tree/main/plugins/project-phase).

MIT licensed.
