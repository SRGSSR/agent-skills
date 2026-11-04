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
- (Only if the eval has `global_instructions`.) The user's global agent instructions, loaded in every project, contain: `<global_instructions>`

Installed skills (load a skill by reading its SKILL.md when its description matches the situation, then follow it):
- project-phase (<repo>/skills/project-phase/SKILL.md): <description from its frontmatter, verbatim>
- work-journal (<repo>/skills/work-journal/SKILL.md): <description from its frontmatter, verbatim>
- backlog (<repo>/skills/backlog/SKILL.md): <description from its frontmatter, verbatim>

When finished, write the exact final message you would send to the user into <run-dir>/outputs/final_message.md
```

For setup evals, add to the non-interactive note: "proceed as if the user accepted your recommendation".

Subagents inherit the runner's global instructions (for example `~/.claude/CLAUDE.md`). If those are written in a language other than the user message, the agent may reply in that language: the reply-language judgments (evals 8-10) are only meaningful with English or no global instructions.

Hooks reach subagents too: a global style plugin that injects rules at session or subagent start (for example a minimalism plugin like ponytail) is active in both variants. Results then measure the skills on top of those rules, which is realistic for that team but not a clean baseline; note it in the report or disable the plugin for the run.

Use the descriptions verbatim: they are what triggers a skill, and evals 6-10 test exactly that (on/off phrases, Italian, French and German requests). Keep the user message in its original language.
