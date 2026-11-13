# Design notes

Why the skills work the way they do, and what was discarded. This repo keeps its design decisions here, one section per topic, and in code comments (its own `work-journal` block names this file). For what the skills do, see the [README](../README.md) and the [guides](README.md).

## On / off

- `off` leaves a one-line marker (`<!-- project-phase:off -->`) instead of just deleting the block: the skills trigger on common phrases and `work-journal` sets itself up on the first journal entry, so a deleted block would come back. Discarded: the off state in `.ai/` (an extra read on every trigger, and `work-journal` has no state file), commenting the block out (it contains HTML comments, which don't nest, and would still cost context), a global switch (uninstalling is that).
- While off, an explicit request is still served once, with a one-line reminder: refusing would be unhelpful, silently turning the skill back on would defeat `off`. `.ai/` is never touched by on/off.
- `project-phase on` rebuilds the block from `.ai/phase.md` like setup does, so `off` first moves hand-added bullets to `## Custom rules`.
- The skills are written in English only, and triggers work in Italian, French and German without examples. Replies follow the user's language (the English skill text pulled replies into English before this was stated); files keep the language they already use. Forcing files to English was discarded: a team writing its journal in German should not get mixed-language files.

## Several people, long-lived projects

- One handoff per branch, no index file of active work: a file everyone updates is itself a conflict point, and `ls .ai/handoff/` is the index. Deleted when the branch's task is done instead of left in an idle state.
- Journal and debt stay shared, with `merge=union`. Discarded: everything per branch, `.ai/<branch>/` (debt belongs to the code and survives the merge; dead ends recorded on one branch would be invisible to the next); one journal per author (fragmented history, names in files); the journal on a separate branch or in `git notes` (invisible to other tools); periodic summaries of old journals (cost tokens and become a second truth that drifts); year subfolders (`ls .ai/journal | tail -n 1` makes them unnecessary); automatic deletion of old journals.
- The journal header names the branch, not the person: `git log` has the author, and no personal data goes into the files. `linguist-generated` only on the journal, so handoff, phase and debt changes stay visible in pull request reviews.
- Merges done by people are logged at the next resume, in the next commit the agent makes anyway. Discarded: a post-merge git hook (leaves an uncommitted change on `develop`, works only where installed) and a dedicated commit (an extra commit, and on many teams an extra confirmation, for every merge).
- A merge into the branch (`develop` → feature) can make the handoff stale. At resume the agent compares `git diff --stat` of the merge with the files the handoff relies on; reading the whole merge diff every time was discarded as too expensive.
- Not verified: whether GitHub and GitLab merge buttons honor `merge=union`. Local merges do.

## Project phases

- The contract wins over generic coding-style instructions (global rules, style plugins) where they conflict, because it is the team's choice for one project; explicit user requests still win for a task. Without this line, a global "always fix the root cause" or "no scaffolding" rule and the phase contract were resolved differently each time. Maintenance makes the most common conflict explicit: fix at the root only if no other caller changes behavior.
- The plan of a transition (prototype → stabilize takes weeks) lives in `.ai/debt.md` as open items with a priority (`must`, `soon`, `later`), not only in the conversation. Discarded: the handoff (bound to one branch) and a plan section in `phase.md` (a second list next to the debt).
- Fixed debt items are deleted, not marked: the file stays short, and with `merge=union` two branches changing the same line's status would leave both versions. Accepted items stay, because they record a decision.
- Asking for the phase in repos without one is opt-in (`project-phase: ask` in the global instructions): otherwise every repo without a block would load the skill and get a question, also for people who installed the skill for one project. An unanswered question is not recorded (no "asked, no answer" state to maintain); the agent asks again at most once per session and meanwhile states the phase it assumes. A confirmed phase is a history line, so the next session doesn't ask again for the same signal.
- Explore findings and production observations the user wants to keep go to design decisions, tasks or the debt list: the final message alone gets lost.

## Design decisions and tasks

- In `docs/` or a tracker, not in `.ai/`: they are written for people and outlive branches, while `.ai/` is the agents' working state. Both are optional, because some teams want no extra folders.
- One file per task with no status field: separate branches touch separate files, and the merge closes the task by deleting its file. Discarded: a single `ROADMAP.md` (every branch edits the same lines; `merge=union` would duplicate edited lines), a status field (git and the branch already say it), the agent assigning tasks on its own.
- Follow-ups and open questions become tasks at the end of a branch, because in the journal nobody finds them again.

## Trackers and `/backlog`

- Trackers are reached through their CLIs (`glab`, `gh`, `acli`), with a connector only as fallback: a CLI works with any agent, a connector only in tools that support it. Every write to a tracker needs the user's confirmation, even when typed as a command, because others are notified and git can't undo it; task files don't, because git can.
- When a CLI is not logged in, the agent offers the login command and stops. It never asks for a token in the chat, and never falls back to a task folder or to guessed issues.
- Jira is detected from issue keys repeated in branch names and commit subjects, because the git remote says nothing about it; the code can stay on GitHub or GitLab. Jira has no `Closes #42`: a work item is moved to Done after the merge, with the status names of the project's workflow (asked when unclear).
- Sprints are the team's planning: new work items go to the backlog, and the agent never moves a work item into or out of a sprint, deletes or archives one. The listing runs two searches, current sprint and the rest, because JQL can't sort by "in an open sprint".
- Subcommands are fixed words: `/backlog filter <condition>` rather than `/backlog <condition>`, which would clash with a condition like "close". Names chosen to avoid clashes: `/backlog` (not `/task`, close to built-in commands) and `setup` (not `init`, which Claude Code uses; "setup" is also the skills' own term).
- `.ai/team.md` is a Markdown table the agent reads, not a script: the skills stay plain Markdown for any agent, a few dozen rows need no program, and two people with the same nickname need a question anyway. It holds personal data, so it exists only when someone asks for it: never proposed at setup or when a name is missing, and the agent warns before collecting anything. Whoever asks chooses whether it is committed (one shared file, with names everyone with access already sees in `git log` and the tracker) or ignored by git; in a public repo the agent recommends ignoring it, because linking accounts, nicknames and roles would put them online. The columns are padded so the table reads in plain text. It is filled from git authors and tracker members, matching people by name and asking about uncertain matches; Jira gets the account ID, never an email. Roles only drive suggestions: the agent never assigns on its own.
- `/start` and `/finish` bracket one branch, not one session: a branch spans many sessions, paused and resumed through its handoff. `/finish` requires the mode (`merge`, `merge-request` or `mr`, `pull-request` or `pr`) because how work is integrated is the user's choice; without git flow, `merge` goes back into the branch recorded as `Base:` in the handoff, since git doesn't remember where a branch started. Names: `/finish` rather than `/close`, which `/backlog close` already uses for tasks, and the words of git flow (`feature start`, `feature finish`). With `mr` and `pr`, the handoff deletion is committed in the request itself, so merging it in the web UI completes the work. When a branch's task looks done, the agent suggests `/finish` and waits instead of closing it on its own, so the checks run in one place and the user picks how to integrate.
- `/finish` checks the docs only for what the branch changed, not the whole documentation: an audit on every finish would cost too much and stop on old gaps. It asks for an example only where the docs already show examples for similar things, so it follows each project's own style instead of imposing one.
- A listing fetches at most 100 tasks (the CLIs default to 30, which silently cut longer backlogs) and says when there may be more.

## Layout, names and manifests

- One folder per plugin (`plugins/<plugin>/skills/<skill>/`) instead of one `skills/` at the root shared by both plugins: the Anthropic plugin directory takes one plugin folder per submission and refused the shared root, and each installed plugin now carries only its own folder. `npx skills add` finds skills nested this way. Links between skills stay inside the work-journal plugin, so the split broke none. Discarded: one plugin with all five skills (forces both on everyone and changes the install ids), symbolic links from a root `skills/` (the directory doesn't count linked skill folders, and they break on some Windows checkouts).
- A plugin's version lives only in its `.claude-plugin/plugin.json`: `claude plugin validate --strict` wants it there, and a second copy in `marketplace.json` would drift. The marketplace entry keeps name, source and description, which people see while browsing.
- Skill descriptions are double-quoted in the frontmatter: strict YAML parsers skip a plain value that contains `: ` (`npx skills`, with skills 1.8.1, installed three of the five skills). Claude Code tolerates it, so the failure was invisible there.
- Repository `SRGSSR/agent-skills`, marketplace `srgssr`: renamed before the public launch, while few people had installed it. The old `srgssr-` prefix repeated the owner, and "agent skills" is what people search for; the repository can also host further skills from SRG SSR. So few people had installed it that the README carries no migration notes: removing the old marketplace uninstalls its plugins, then they add the new one.

## README and public texts

- Section headings stay without emoji: other pages link to anchors such as `README.md#install` and `#disable-or-uninstall`, and an emoji changes the anchor. Emoji go in tables and lists.
- Public texts (README, posts, list entries) speak as a team at SRG SSR that uses the skills in its own work. SRG SSR appears as author and licensor, never as a place where the skills are widely used: that would claim more than is true.
- Eval numbers are quoted with their date, the skill versions and the number of cases, and say where the model already did well without the skills: a bare "126/126" reads as more than it measured.
- The README leads with what changes for the user (one request, three phases), then the evidence, then install. Reference material (tool notes, a handoff example) is folded in `<details>`, and the reasoning lives here.
