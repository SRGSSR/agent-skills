---
name: work-journal
description: Keeps a terse work journal and a handoff document in the repo so work can be paused at any moment and resumed later by the same or a different AI agent, model or tool, or by a human. Use this skill whenever the user is stopping or pausing ("let's stop here", "I'll continue tomorrow", "pick this up later", "switching to another model"), asks for a handoff, a session summary or a devlog, wants to continue previous work ("where were we?", "resume", "continue from yesterday"), or wants to set up resumable or logged AI sessions, or wants to turn it on or off for a project (`/work-journal on`, `/work-journal off`, "stop keeping the journal here"). Also use it when starting work in a repo that has `.ai/handoff.md` or `.ai/journal/`, and before the context runs out on a long task.
license: MIT
metadata:
  version: "0.2.0"
---

# Work Journal

Work with AI agents gets interrupted all the time: the session ends, the context fills up, a quota runs out, you switch model or tool, a colleague takes over. Whatever was not written down is lost. The next agent rediscovers it the expensive way, or repeats the same dead ends.

This skill keeps two small Markdown files in the repo so that anyone, agent or human, can continue with zero prior context:

| File | Answers | Lifecycle |
|---|---|---|
| `.ai/journal/YYYY-MM-DD.md` | How did we get here? Decisions, reasons, dead ends | Append-only, one file per day |
| `.ai/handoff.md` | Where are we, and what exactly is next? | Overwritten each time; always the current state |

The journal is history; the handoff is state. A successor should only need the handoff and the last few journal entries, never the whole history.

Everything is plain Markdown with no tool-specific features, so any agent that can read files can use it.

Talk in the user's language: this skill is written in English, but reports, questions and the final message go in the language the user writes in. Files (the `AGENTS.md` block, journal, handoff) keep the language they already use; new ones are in English.

## Setup

When the user asks to set this up, or the first time you write a journal entry in a repo without it (unless it is off, see [On / off](#on--off)):

1. Add the block below to `AGENTS.md` (create the file if missing; leave existing content untouched). Agent tools load it on every task, which is what makes the protocol work even when this skill is not loaded.
2. Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md`. If `CLAUDE.md` exists and does not import it, add a line `@AGENTS.md` near the top.
3. Don't create `.ai/` files yet; they are created on first write.
4. Tell the user, in one line, that `.ai/` is meant to be committed so the handoff travels across machines and people. If they prefer to keep the journal private, add `.ai/journal/` to `.gitignore` and keep `handoff.md` committed (or ignore all of `.ai/`).

```markdown
<!-- work-journal:start -->
## Work journal and handoff
- Before starting: if `.ai/handoff.md` exists, read it and the last entries of the newest file in `.ai/journal/`, then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context.
- Point to files and commits instead of copying content. Never write secrets, tokens or personal data in these files.
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
```

## On / off

The user can turn the protocol off for one project, with `/work-journal off`, or by asking in words, and turn it back on with `/work-journal on`.

**Off** means `AGENTS.md` contains the one-line marker `<!-- work-journal:off -->` instead of the block above. The marker exists so that this skill does not add the block back on its own (setup runs on the first journal entry otherwise). While it is there:
- Don't read the handoff at session start, don't journal at checkpoints, don't write the handoff unprompted, don't run setup.
- Do what the user explicitly asks this time ("write a handoff", "where were we?"), without turning the protocol back on. Mention once, in one line, that work-journal is off here and `/work-journal on` re-enables it.

**To turn it off:** replace the block, from `<!-- work-journal:start -->` to `<!-- work-journal:end -->` inclusive, with `<!-- work-journal:off -->`. If there is no block, add the marker near the top of `AGENTS.md` (create the file if missing). Leave `.ai/` and any `@AGENTS.md` line in `CLAUDE.md` as they are. Report in one line: off for this project, files kept in `.ai/`, `/work-journal on` restores it.

**To turn it on:** if the block is already there, say so. Otherwise replace the marker (or, without a marker, add the block) with the block above and run the rest of setup: `CLAUDE.md` import, and the one-line note about committing `.ai/` only if `.ai/` does not exist yet. Report in one line.


At the start of a session in a repo that has a handoff or journal, unless work-journal is off there:

1. **Read** `.ai/handoff.md`. If there is none, read the last few entries of the newest journal file. Don't read older journal files unless you need to know why something was done.
2. **Verify** against reality: current branch, `git status`, `git log --oneline` since the handoff date, and the verify command in the handoff if there is one. The handoff may be stale: someone else may have worked since, or the previous session may have died before updating it.
3. **Reconcile.** If the state disagrees with the handoff, or the handoff lists open questions for the user, raise it before acting. Otherwise state in one or two lines what you are resuming and the next step, then do it.
4. **Respect the history.** Don't redo completed steps. Don't retry a recorded dead end unless something has changed, and say what changed.
5. **Log** a journal entry: `Resumed from handoff of <date> (<tool/model>)`, plus any discrepancy you found.

## Journaling

Write an entry at checkpoints, not after every edit:

- a meaningful step is done (feature slice works, test passes, bug located);
- a decision is taken, especially one a successor might question;
- an approach is abandoned (dead ends are the most valuable entries, because they are the most expensive to rediscover);
- before a risky operation (migration, large refactor, force push);
- at the end of a session.

Format: get the time with `date "+%H:%M"` and the file name with `date "+%Y-%m-%d"`. Identify yourself as `tool/model` (for example `claude-code/claude-opus-5-5`, `codex/gpt-5`, or `human/<name>` when the user dictates an entry).

```markdown
## 14:32 · claude-code/claude-opus-5-5 · CSV export
- Did: added `GET /items.csv` in `src/routes/items.js`, reusing the list query.
- Decided: stream rows instead of building one string, because lists reach 50k items.
- Dead end: `json2csv` breaks on the nested `tags` field; wrote a 10-line formatter instead.
- Next: download button in `views/items.ejs`.
```

Include only the lines that apply. Aim for 2 to 6 lines. Facts, decisions and reasons, not narration ("I then looked at..."). Point to files, functions and commits; never paste diffs, logs or large outputs. Create the day's file with a `# Journal YYYY-MM-DD` heading if it does not exist, and append new entries at the end.

## Writing the handoff

Write or rewrite `.ai/handoff.md` when:

- the user pauses or ends the session;
- you are about to hand over to another agent, model or person;
- a task ends with follow-ups still open;
- the context is getting long (the tool warns about compaction, or the conversation has been going for a long time);
- on long tasks, at milestones, so an abrupt stop (crash, quota, closed laptop) still leaves a usable state. Write it before you need it.

Write for a capable reader who has never seen this project or conversation. The first next step must be startable immediately without asking anything. Keep it under about 60 lines; if it grows, you are copying content that should be a pointer.

```markdown
# Handoff
Updated: 2026-10-02 17:40 · by: claude-code/claude-opus-5-5
Branch: feature/csv-export · Last commit: a1b2c3d · Uncommitted: `src/export.js` (work in progress)
Phase: prototype   <!-- only if the project-phase block exists -->

## Goal
Users can export the item list as CSV from the list page. Done when the button downloads a file that opens correctly in Excel.

## Status
- [x] `GET /items.csv` endpoint, streams rows
- [~] Excel compatibility: UTF-8 BOM added, separator still wrong for Swiss locale
- [ ] Download button in `views/items.ejs`

## Next steps
1. In `src/export.js`, make the separator configurable (`;` for de-CH); see the comment at `formatRow`.
2. Add the button to `views/items.ejs` next to "New item".
3. Test manually with the 3-item sample (`npm run seed`).

## Decisions
- Custom formatter instead of `json2csv`: nested `tags` field (journal 2026-10-02 14:32).

## Dead ends
- `json2csv`: breaks on nested fields. Don't retry without flattening first.

## Open questions
- For the user: should archived items be included?

## How to verify
- `npm test`: all green except `export.test.js > separator` (expected until step 1 is done).

## Pointers
- Journal: `.ai/journal/2026-10-02.md`
- Key files: `src/export.js`, `src/routes/items.js`
```

Before finishing, check: could a different model, in a different tool, continue from this file plus the repo, without the conversation? If not, add what is missing.

### When the task is complete

Don't leave a stale handoff pretending work is in progress. Replace it with a short idle state:

```markdown
# Handoff
Updated: 2026-10-03 11:05 · by: codex/gpt-5
No active task. Last completed: CSV export (merged in a1b2c3d).
Follow-ups: archived items in export? (user to decide).
```

### Parallel work

When several agents or branches work at the same time, give each stream its own handoff in `.ai/handoff/<branch-or-topic>.md` and keep `.ai/handoff.md` as a short index of active streams. Journal merge conflicts are trivial: keep both sides, ordered by time.

## Privacy and safety

These files are usually committed and readable by everyone with repo access. Never write secrets, tokens, passwords, connection strings, customer data or personal data. Refer to them by name ("the staging API key in the team vault"). If the repo is public, write as if the journal were public, because it is.

## With the project-phase skill

If `AGENTS.md` contains a `project-phase` contract block (not the `<!-- project-phase:off -->` marker): add the phase line to the handoff header, log phase changes in the journal, and in explore and prototype journal only decisions, dead ends and session ends, to keep the overhead in line with the phase.
