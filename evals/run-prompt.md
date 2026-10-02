# Eval run prompt

Each eval runs twice in a fresh subagent: `with_skill` and `without_skill`. Replace the placeholders. `without_skill` uses the same text without the "Installed skills" section.

Run layout (what `evals/grade.mjs` and the skill-creator viewer expect):

```
<workspace>/iteration-N/eval-<id>-<name>/
├── eval_metadata.json            # { eval_id, eval_name, prompt, assertions }
└── <with_skill|without_skill>/run-1/
    ├── repo/                     # copy of the fixture variant from build.sh
    ├── base_commit.txt           # git rev-parse HEAD of repo/ before the run
    ├── eval_metadata.json        # same file again (the viewer looks next to the run)
    ├── timing.json               # tokens and duration from the subagent notification
    ├── manual.json               # optional judgment grades
    └── outputs/
        ├── final_message.md      # written by the subagent
        └── changes.diff.txt      # git diff vs base_commit, added after the run
```

The subagent writes into `run-1/repo/` and `run-1/outputs/`. After it finishes: `git -C repo add -N . && git -C repo diff <base> > outputs/changes.diff.txt`, then `node evals/grade.mjs <name> <run-dir>`.

## Prompt

```
You are running an evaluation task. Act as a coding agent working in the repository below, exactly as you would for a real user.

Repository: <run-dir>/repo
Work only inside it; use absolute paths.

User message: "<prompt from evals.json>"

Environment notes:
- In real use your tool loads the repo's AGENTS.md / CLAUDE.md automatically. Read them first if they exist and treat them as project instructions.
- This is non-interactive: you cannot ask the user anything. Where you would normally ask and wait, use your best judgment, proceed, and put the question in your final message.
- Don't commit, push or create branches. If you start a server to check something, stop it before finishing. Network access may be unavailable.
- If you need to identify yourself (tool/model): <tool>/<model>.

Installed skills (load a skill by reading its SKILL.md when its description matches the situation, then follow it):
- project-phase (<repo>/skills/project-phase/SKILL.md): Sets and applies the project's lifecycle phase (explore, prototype, stabilize, production, maintenance, sunset) so the agent works the way that phase needs - no over-engineering or unsolicited advice while prototyping, structural suggestions and tech-debt tracking in production, minimal regression-safe diffs in maintenance. Use when the user wants to set up, check or change the project phase; or when AGENTS.md or CLAUDE.md contains a project-phase block and it is unclear how the phase applies to the current request.
- work-journal (<repo>/skills/work-journal/SKILL.md): Keeps a terse work journal and a handoff document in the repo so work can be paused and resumed by another agent, model or human. Use when the user is stopping or pausing, asks for a handoff, wants to continue previous work, or when starting work in a repo that has .ai/handoff.md or .ai/journal/.

When finished, write the exact final message you would send to the user into <run-dir>/outputs/final_message.md
```

For setup evals, add to the non-interactive note: "proceed as if the user accepted your recommendation".
