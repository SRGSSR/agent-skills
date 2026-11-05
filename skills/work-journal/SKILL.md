---
name: work-journal
description: Keeps a terse work journal and a handoff document per branch in the repo so work can be paused at any moment and resumed later by the same or a different AI agent, model or tool, or by a human, also when several people work on the same project. Use this skill whenever the user is stopping or pausing ("let's stop here", "I'll continue tomorrow", "pick this up later", "switching to another model"), asks for a handoff, a session summary or a devlog, wants to continue previous work ("where were we?", "resume", "continue from yesterday"), or wants to set up resumable or logged AI sessions, or wants to turn it on or off for a project (`/work-journal on`, `off`, "stop keeping the journal here") or types `/work-journal help`. Also use it when starting work in a repo that has `.ai/handoff/`, `.ai/handoff.md` or `.ai/journal/`, when a branch's task is done, when the user asks what to work on next or where design decisions and tasks are kept, and before the context runs out on a long task.
license: MIT
argument-hint: "[setup | on | off | help]"
metadata:
  version: "0.12.1"
---

# Work Journal

Work with AI agents gets interrupted all the time: the session ends, the context fills up, a quota runs out, you switch model or tool, a colleague takes over. Whatever was not written down is lost. The next agent rediscovers it the expensive way, or repeats the same dead ends.

This skill keeps two small Markdown files in the repo so that anyone, agent or human, can continue with zero prior context:

| File | Answers | Lifecycle |
|---|---|---|
| `.ai/journal/YYYY-MM-DD.md` | How did we get here? Decisions, reasons, dead ends | Append-only, one file per day, shared by all branches |
| `.ai/handoff/<branch>.md` | Where are we on this branch, and what exactly is next? | Overwritten each time; deleted when the branch's task is done |

The journal is history of the project; the handoff is state of one branch. A successor should only need the handoff of its branch and the last few journal entries, never the whole history.

The handoff file name is the branch name with `/` replaced by `-`: `feature/csv-export` → `.ai/handoff/feature-csv-export.md` (outside git: `.ai/handoff/main.md`). One file per branch means people and agents on different branches never overwrite each other's state.

Everything is plain Markdown with no tool-specific features, so any agent that can read files can use it.

Project state belongs in the repo: progress, decisions and next steps go in these files (and in the design decisions and tasks below), not in your tool's private memory, which other agents and people can't read. Private memory is for the user's personal preferences.

Two more places hold what outlives a branch, both chosen per project at setup and named in the `AGENTS.md` block: **design decisions** (why things are the way they are) and **tasks** (open work). See [Design decisions and tasks](#design-decisions-and-tasks).

Commands:

- `/work-journal`: where things stand, as in [Resuming](#resuming).
- `/work-journal setup`: set it up, or review where design decisions and tasks go in a project already set up. See [Setup](#setup).
- `/work-journal on`, `/work-journal off`: turn it on or off for this project. See [On / off](#on--off).
- `/work-journal help`: this list, with where design decisions and tasks go (or off, or not set up) from the block in `AGENTS.md`, and the `/backlog` commands. Read only the block; run nothing else.

In the same plugin, `/start <task or name>` opens a branch for a task with its first handoff, and `/finish <merge | mr | pr>` checks that the work is done and documented, then merges it or prepares the merge or pull request (see the [start](../start/SKILL.md) and [finish](../finish/SKILL.md) skills).

Everything else works in words: "let's stop here", "where were we?", "write a handoff".

Talk in the user's language: this skill is written in English, but reports, questions and the final message go in the language the user writes in. Files (the `AGENTS.md` block, journal, handoff) keep the language they already use; new ones are in English.

## Setup

When the user asks to set this up (`/work-journal setup`), or the first time you write a journal entry in a repo without it (unless it is off, see [On / off](#on--off); an explicit setup replaces the off marker with the block):

1. Add the block below to `AGENTS.md` (create the file if missing; leave existing content untouched). Agent tools load it on every task, which is what makes the protocol work even when this skill is not loaded.
2. Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md`. If `CLAUDE.md` exists and does not import it, add a line `@AGENTS.md` near the top.
3. **Choose where design decisions and tasks go**, and write the two configuration lines at the top of the block accordingly:
   - Design decisions: if the repo has `docs/adr/`, `docs/decisions/` or `docs/design/`, use it. Otherwise propose `docs/design/` (or a single `docs/decisions.md` for a small project), or none.
   - Tasks: if `origin` is on GitLab or GitHub (`git remote get-url origin`: `gitlab.com`, `github.com`, or a self-hosted host that `glab auth status` lists or whose name says gitlab), propose its issues. Jira comes first if branch names or commit subjects keep repeating one issue key (`git branch -a` and `git log -200 --format=%s`, pattern `[A-Z][A-Z0-9]+-[0-9]+`, ignoring names like `UTF-8` or `SHA-256`), or if the user names Jira: propose that project. Add the site (`<name>.atlassian.net`) to the line if `acli jira auth status` shows it; if not, write the line without it and ask for the site, which the user needs only to log in. The code can live on GitHub or GitLab with the tasks in Jira. Likewise another tracker if a connector for it is available. Otherwise `docs/backlog/` (one file per open task: no notifications or boards, fine for developers who read the repo), or none. If the repo already keeps open work in a file (`ROADMAP.md`, `TODO.md`), offer to split it into `docs/backlog/` files; without a yes, name that file as the task list and keep its format. A repo that already has `docs/tasks/` or `docs/todo/` with one file per task keeps it: name that folder in the block.
   - Line variants: `Design decisions: none (code comments, commit messages, README).`, `Tasks: GitLab issues of team/podcast (via glab; writes only with the user's confirmation).`, `Tasks: Jira PODCAST on example.atlassian.net (via acli; writes only with the user's confirmation).`, `Tasks: Jira PODCAST, parent = PODCAST-10 (via acli; writes only with the user's confirmation).` (a fixed filter, only if the user asks for one), `Tasks: none (follow-ups go in the final message).`
   - Ask the user only about what you could not detect, in one question. If setup runs without the user asking for it, don't stop the task for this: ask in the final message and leave the lines out until they answer. A block without them means none for both. Never create the folders now; the first file creates them.
   - Team: if git shows more than one author in the last 12 months or the tasks are in a tracker, propose `.ai/team.md` filled in (format in the [backlog skill](../backlog/SKILL.md#people-aiteammd)). Sources: `git log --since=12.months --format='%aN' | sort -u` (names only, never emails); GitLab `glab api "projects/:id/members/all"` (username, name); GitHub `gh api "repos/{owner}/{repo}/collaborators" --jq '.[].login'` and each login's name (`gh api users/<login> --jq .name`); Jira the assignees of the project's work items (account ID, display name). Match people across systems by name; mark uncertain matches with `?` and list them for the user, never guess. Handle: the tracker username (else the GitLab or GitHub one, else the git name in lowercase with hyphens); Aliases: the first name; Roles: empty. Skip bots (`[bot]`, `dependabot`, `gitlab-bot`, `renovate`). Show the table, write it after the user's yes. In a public repo it is ignored by git (see the backlog skill).
4. Add this line to `.gitattributes` (create the file if missing) unless it is already there. `merge=union` makes git keep both sides when two branches append to the same day's journal, instead of reporting a conflict; `linguist-generated` collapses journal diffs in GitHub pull requests.
   ```
   .ai/journal/*.md merge=union linguist-generated=true
   ```
5. Don't create `.ai/` files yet; they are created on first write.
6. Tell the user, in one line, that `.ai/` is meant to be committed so the handoff travels across machines and people. If they prefer to keep the journal private, add `.ai/journal/` to `.gitignore` and keep `.ai/handoff/` committed (or ignore all of `.ai/`).

**Review (`/work-journal setup` with the block already there).** Show the two configuration lines, run step 3's detection again, and propose only what it suggests changing: issues or Jira keys that appeared since, a task folder that grew into a tracker, a fixed filter if the user asks, people missing from `.ai/team.md` (or the whole file if there is none). Change only the lines the user confirms, update the rest of the block to the current template if it is older, keeping those two lines, and add what steps 2 and 4 find missing (`@AGENTS.md`, the `.gitattributes` line). Never touch the journal, handoffs, task files or design decisions: moving existing tasks to a tracker is a separate step, each issue created with the user's confirmation as in the [backlog skill](../backlog/SKILL.md#creating-backlog-new). If nothing needs to change, say so in one line.

```markdown
<!-- work-journal:start -->
## Work journal and handoff
- Design decisions: `docs/design/`.
- Tasks: `docs/backlog/`, one file per open task.
- Before starting: read `.ai/handoff/<branch>.md` for the current branch (`/` in the name → `-`) if it exists, and the last entries of the newest journal file (`ls .ai/journal | tail -n 1`), then check them against the git state before continuing.
- While working: at checkpoints (step done, decision taken, approach abandoned), append a terse entry to `.ai/journal/YYYY-MM-DD.md`: `## HH:MM · tool/model · branch · topic`, then only the lines that apply: Did / Decided (why) / Dead end (why) / Next.
- When pausing, handing off, finishing with loose ends, or running low on context: rewrite `.ai/handoff/<branch>.md` (Goal, Status, Next steps, Decisions, Dead ends, Open questions, How to verify) so another agent can continue with zero context. Never touch other branches' handoffs.
- When the branch's task is done: move decisions and dead ends that must outlast it to code comments or the design decisions above, close the branch's task, add follow-ups and open questions as new tasks, then delete its handoff.
- Project state goes in these files, not in your tool's private memory. Point to files and commits instead of copying content. Never write secrets, tokens or personal data (tasks may name an assignee by team handle).
- Formats and details: `work-journal` skill.
<!-- work-journal:end -->
```

**Upgrading from an older version** is part of the protocol, not an unrequested change: do it without asking whenever you find the old layout. If `AGENTS.md` has a work-journal block that differs from the one above apart from its two configuration lines, replace it, keep its configuration lines, and run setup step 4. If it has no configuration lines (0.3 and earlier), run setup step 3 too. If `.ai/handoff.md` exists (the single handoff of version 0.2 and earlier), treat it as the handoff of the branch it names, or of the current branch; the next time you write the handoff, write `.ai/handoff/<branch>.md` and delete `.ai/handoff.md`. If it is only an idle state ("No active task"), delete it. Mention the upgrade in one line.

## On / off

The user can turn the protocol off for one project, with `/work-journal off`, or by asking in words, and turn it back on with `/work-journal on`.

**Off** means `AGENTS.md` contains the one-line marker `<!-- work-journal:off -->` instead of the block above. The marker exists so that this skill does not add the block back on its own (setup runs on the first journal entry otherwise). While it is there:
- Don't read the handoff at session start, don't journal at checkpoints, don't write the handoff unprompted, don't run setup.
- Do what the user explicitly asks this time ("write a handoff", "where were we?"), without turning the protocol back on. Mention once, in one line, that work-journal is off here and `/work-journal on` re-enables it.

**To turn it off:** replace the block, from `<!-- work-journal:start -->` to `<!-- work-journal:end -->` inclusive, with `<!-- work-journal:off -->`. If there is no block, add the marker near the top of `AGENTS.md` (create the file if missing). Leave `.ai/`, design decisions, tasks, `.gitattributes` and any `@AGENTS.md` line in `CLAUDE.md` as they are. Report in one line: off for this project, files kept in `.ai/`, `/work-journal on` restores it.

**To turn it on:** if the block is already there, say so. Otherwise replace the marker (or, without a marker, add the block) with the block above and run the rest of setup: configuration lines, `CLAUDE.md` import, `.gitattributes`, and the one-line note about committing `.ai/` only if `.ai/` does not exist yet. Report in one line.

## Resuming

At the start of a session in a repo that has a handoff or journal, unless work-journal is off there:

1. **Read** `.ai/handoff/<branch>.md` for the current branch (or the old single `.ai/handoff.md`), then the last few entries of the newest journal file (`ls .ai/journal | tail -n 1`; never list or read the whole folder). If the branch has no handoff, `ls .ai/handoff/` shows the work open on other branches: those belong to other people or streams, so mention them only if relevant and don't resume them unless the user asks. Don't read older journal files unless you need to know why something was done. If the repo has the old single handoff, or its work-journal block differs from the one in [Setup](#setup) beyond the two configuration lines, upgrade now (see Setup): it is part of resuming.
2. **Verify** against reality: current branch, `git status`, `git log --oneline` since the handoff date, and the verify command in the handoff if there is one. The handoff may be stale: someone else may have worked since, or the previous session may have died before updating it.
   Check merges too, because people often merge without an agent: `git log --merges --oneline` since the handoff date (or the last journal entry). When another branch was merged into this one (typically `develop`, to bring in work done meanwhile), list what it changed with `git diff --stat <merge>^1 <merge>` and compare with the files the handoff's Status and Next steps rely on, and with the project-phase block. A step may already be done, a file may have moved, a dead end may no longer be one. Don't read the whole merge diff, only what overlaps.
3. **Reconcile.** If the state disagrees with the handoff (including after a merge), update the handoff to match. If that changes the plan, or the handoff lists open questions for the user, raise it before acting. Otherwise state in one or two lines what you are resuming and the next step, then do it.
4. **Respect the history.** Don't redo completed steps. Don't retry a recorded dead end unless something has changed, and say what changed.
5. **Log** a journal entry: `Resumed from handoff of <date> (<tool/model>)`, plus any discrepancy you found. Note each merge since the last entry in one line, in either direction, even when there was no handoff to resume: `Merged feature/x into develop (a1b2c3d)`, or `Merged develop into feature/x (c3d4e5f): client moved to src/api/, step 3 updated` (or `no impact on the plan`). Never make a commit just for this line: it goes in with the next commit of the session.

## Journaling

Write an entry at checkpoints, not after every edit:

- a meaningful step is done (feature slice works, test passes, bug located);
- a decision is taken, especially one a successor might question;
- an approach is abandoned (dead ends are the most valuable entries, because they are the most expensive to rediscover);
- before a risky operation (migration, large refactor, force push);
- at the end of a session.

Format: get the time with `date "+%H:%M"` and the file name with `date "+%Y-%m-%d"`. Identify yourself as `tool/model` (for example `claude-code/claude-opus-5-5`, `codex/gpt-5`, or `human/<name>` when the user dictates an entry). Add the current branch, so entries of different streams in the same day's file stay apart (who wrote them is already in `git log`).

```markdown
## 14:32 · claude-code/claude-opus-5-5 · feature/csv-export · CSV export
- Did: added `GET /items.csv` in `src/routes/items.js`, reusing the list query.
- Decided: stream rows instead of building one string, because lists reach 50k items.
- Dead end: `json2csv` breaks on the nested `tags` field; wrote a 10-line formatter instead.
- Next: download button in `views/items.ejs`.
```

Include only the lines that apply. Aim for 2 to 6 lines. Facts, decisions and reasons, not narration ("I then looked at..."). Point to files, functions and commits; never paste diffs, logs or large outputs. Create the day's file with a `# Journal YYYY-MM-DD` heading if it does not exist, and append new entries at the end.

## Writing the handoff

Write or rewrite `.ai/handoff/<branch>.md` when:

- the user pauses or ends the session;
- you are about to hand over to another agent, model or person;
- a task ends with follow-ups still open;
- the context is getting long (the tool warns about compaction, or the conversation has been going for a long time);
- on long tasks, at milestones, so an abrupt stop (crash, quota, closed laptop) still leaves a usable state. Write it before you need it.

Write for a capable reader who has never seen this project or conversation. The first next step must be startable immediately without asking anything. Keep it under about 60 lines; if it grows, you are copying content that should be a pointer.

```markdown
# Handoff
Updated: 2026-10-02 17:40 · by: claude-code/claude-opus-5-5
Branch: feature/csv-export · Base: develop · Last commit: a1b2c3d · Uncommitted: `src/export.js` (work in progress)
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

`Base:` is the branch this one started from, written by `/start` (or, without it, the branch it was created from if you know it). Keep it when rewriting: `/finish merge` merges there.

Before finishing, check: could a different model, in a different tool, continue from this file plus the repo, without the conversation? If not, add what is missing.

### When the branch's task is done

When nothing is left for an agent to do on the branch (what remains, if anything, is review and merge by people), don't leave a stale handoff pretending work is in progress. `/finish` runs these steps with its checks, then merges or prepares the merge request:

1. **Keep what must last.** The journal gets buried over time and the handoff is about to go, so look at its Decisions and Dead ends: whatever will matter after this branch (a constraint, a reason, an approach that fails) goes where people will look. A short comment next to the code it concerns; the design decisions named in the block (with none: the README for decisions about the whole project or its users, the commit message otherwise); a custom rule in `.ai/phase.md` if it is a rule to always follow and project-phase is in use. "It's in the journal" doesn't count, the journal is what gets buried; nor does code that implements a decision without saying why (`batch.slice(0, 500)` doesn't tell the next person that the partner API rejects larger batches). Skip only what mattered during the task alone, and name in the journal entry what you moved or why nothing needed to.
2. **Close the task and file what is left.** Delete the branch's task file, so the merge closes it (with a tracker, see [closing an issue](#tasks)). Follow-ups and open questions from the handoff become new tasks, not lines buried in the journal. See [Tasks](#tasks).
3. **Delete** `.ai/handoff/<branch>.md`, and write a journal entry with what was completed, what you moved where, and the new tasks.

## Design decisions and tasks

### Design decisions

What a successor needs to know about why: decisions not evident from the code, constraints, and the alternatives discarded with the reason. Not task logs, test counts or branch state: git has those. Write or update one when a branch's task is done, or earlier when the user asks to record a decision.

- **An existing folder** (ADRs, `docs/decisions/`): follow its convention.
- **`docs/design/`**: one file per decision or change, `YYYY-MM-DD-<name>.md`, starting with date, status and scope, then Why, Decisions, Alternatives discarded.
- **`docs/decisions.md`**: one section per decision, newest first.
- **None**: a comment next to the code it concerns; the README for decisions about the whole project or its users; the commit message body otherwise.

A superseded document is deleted if it no longer holds at all (git keeps it), or gets a box at the top, `> ⚠️ **Superseded …**`, saying what no longer holds and what does. Never leave a document that describes behavior that no longer exists.

### Tasks

Open work only: what is done disappears, git keeps it. "To decide" items are tasks too ("Decide whether archived items are exported"), done when the decision is recorded.

Listing, creating, commenting on and closing tasks (`/backlog`, `/backlog new`, `/backlog comment`, `/backlog close`, "what should I work on next?" with no handoff on the branch): see the [backlog skill](../backlog/SKILL.md).

**`docs/backlog/`**: one file per task, named like the branch that will do it without the prefix (`csv-export.md` → `feature/csv-export`), so separate branches never touch the same file. The same rules apply to `docs/tasks/` and `docs/todo/` in repos that already use them.

```markdown
# CSV export from the list page
Assignee: @jdoe
Why: billing exports the list by hand every month.
Done when: the list page has a link that downloads a CSV that opens in Excel.
Links: docs/design/2026-10-02-csv-export.md
```

- Optional `## Notes` at the end: dated one-line comments (`- 2026-10-05: billing also wants the archived items`), added by `/backlog comment`.
- No status field: in progress means a branch or handoff exists; done means the file is gone. The branch that does the task deletes its file, so merging the branch closes the task.
- `Assignee` is optional, a team handle (the Handle column of `.ai/team.md` if the project has one, see the [backlog skill](../backlog/SKILL.md#people-aiteammd); otherwise a git or tracker username), never a full name or email. Never assign or reassign a task unless the user asks.
- Write new task files only for follow-ups and open questions at the end of a branch's task, or when the user asks.

**A tracker** (GitLab or GitHub issues, Jira, ...): reach it through its CLI (`glab` for GitLab, `gh` for GitHub, `acli` for Jira Cloud) or a connector (for Jira, the Atlassian connector if `acli` is missing).

- Reading (list, view) needs no confirmation. Every write does: create, close, comment, assign, label. Propose each one in the final message with the exact command, and run it only after the user confirms it.
- If the CLI is missing or not logged in (`glab auth status`, `gh auth status`, `acli jira auth status`), say so and offer to log in, as the [backlog skill](../backlog/SKILL.md#not-logged-in) describes. Never guess issues, and don't switch to a task folder on your own.
- A new issue has the shape of a task file: the title, then Why, Done when and Links in the body. No assignee unless the user asks.
- Name the issue ID in the handoff and the journal. For Jira, also put the key in the branch name (`feature/PODCAST-123-csv-export`) and in commit subjects and the pull or merge request title: Jira's GitHub and GitLab integrations link them to the work item.
- **Closing an issue:** when the branch's task is done, give in the final message the line for the merge request or pull request description, `Closes #42`: merging then closes the issue, as deleting a task file does. GitLab and GitHub honor it only for merges into the project's default branch; if the branch merges elsewhere (git flow with `main` as default, merging into `develop`), say that the issue stays open until that branch reaches the default one, or propose `glab issue close 42` / `gh issue close 42` after the merge.
- **Closing a Jira work item:** `Closes` doesn't apply. Propose in the final message `acli jira workitem transition --key PODCAST-123 --status "Done" --yes` to run after the merge (the status name follows the project's workflow), unless the team moves work items with Jira automation or smart commits (`PODCAST-123 #done`).

**None**: follow-ups and open questions go in the final message and the journal entry of the end of the task.

## Several people on one project

- **Different branches** don't collide: each has its own handoff, and the shared journal merges with `merge=union` (see Setup). Merges done in a web UI may ignore `.gitattributes`; a journal conflict there is still trivial: keep both sides, ordered by time.
- **Same branch:** before rewriting the handoff, pull if the branch has a remote. If the handoff changed since you read it, merge your state into it instead of overwriting; if the two disagree, ask the user.

## Long-lived projects

The journal grows forever, and that is fine: resuming reads only the newest file, so the cost stays the same after years. Find it with `ls .ai/journal | tail -n 1`; search older entries with `grep -rl <file or keyword> .ai/journal` instead of reading them. What must outlast the journal is moved out when a branch's task is done (see above). Never delete or summarize old journal files on your own; a team that wants to prune them can do it by hand, git keeps them.

## Privacy and safety

These files are usually committed and readable by everyone with repo access. Never write secrets, tokens, passwords, connection strings, customer data or personal data. Refer to them by name ("the staging API key in the team vault"). If the repo is public, write as if the journal were public, because it is. The one exception is the optional `Assignee:` team handle in task files; in a public repo, say once that handles there are public. `.ai/team.md` maps people to their handles on each system, with roles and nicknames: it is committed (everyone with access already sees these names in git and the tracker), and ignored by git in a public repo.

## With the project-phase skill

If `AGENTS.md` contains a `project-phase` contract block (not the `<!-- project-phase:off -->` marker): add the phase line to the handoff header, log phase changes in the journal, and in explore and prototype journal only decisions, dead ends and session ends, to keep the overhead in line with the phase. `.ai/debt.md` keeps tracking shortcuts in the code; when the team decides to fix one, the task links the debt item instead of copying it.
