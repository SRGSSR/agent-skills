# Teams and long-lived projects

How the skills behave when several people and agents work on the same repo, on different branches, over months or years.

## What lives where

| Place | Content | Shared how |
|---|---|---|
| `AGENTS.md` blocks | Phase contract and journal protocol | Committed; loaded by every agent on every task |
| `.ai/phase.md` | Phase, overrides, custom rules, history | Committed |
| `.ai/debt.md` | Open and accepted tech debt | Committed; `merge=union` |
| `.ai/journal/YYYY-MM-DD.md` | What was done, decided, abandoned | Committed (or ignored, if the team prefers); `merge=union` |
| `.ai/handoff/<branch>.md` | State of one branch | Committed; one file per branch |
| Design decisions (for example `docs/design/`) | Why things are the way they are | Committed, written for people |
| Tasks (`docs/backlog/` or a tracker) | Open work and open questions | Committed, or in the tracker |

`.ai/` is the agents' working state; design decisions and tasks are for people. The agents' private memory is not used for project state, because other agents and people can't read it.

## Branches

Each branch has its own handoff (`feature/csv-export` → `.ai/handoff/feature-csv-export.md`), so people on different branches never overwrite each other's state. When the branch's task is done, its handoff is deleted.

`ls .ai/handoff/` is the list of work in progress. An agent that starts on a branch without a handoff sees the others, mentions them only if relevant, and doesn't resume them unless you ask.

The journal and the debt list are shared by all branches. Setup adds `merge=union` for them to `.gitattributes`, so when two branches append on the same day, git keeps both sides. Merge buttons in web UIs may ignore `.gitattributes`; the conflict is then trivial: keep both sides, ordered by time.

Two people on the same branch: before rewriting the handoff, the agent pulls if the branch has a remote, and merges its state into a handoff that changed meanwhile instead of overwriting it. If the two disagree, it asks.

## Taking over someone else's work

Check out the branch and ask:

> Where were we?

The agent reads its handoff and the last journal entries, then verifies them against git: new commits since the handoff, uncommitted files, the handoff's verify command. It also looks for merges, because people often merge without an agent: when `develop` was merged into the branch, it compares the files the merge changed (`git diff --stat`) with the files the handoff relies on. A step may already be done, a file may have moved.

If reality disagrees with the handoff, the agent updates the handoff; if that changes the plan, or the handoff has open questions for the user, it asks before acting. Recorded dead ends are not retried unless something changed.

Merges are logged in the journal at the next resume, in the next commit the agent makes anyway, never in a commit of their own.

## Tasks

With `docs/backlog/`, one Markdown file per open task, named like the branch that will do it (a repo that already has `docs/tasks/` or `docs/todo/` keeps it):

```markdown
# CSV export from the list page
Assignee: @jdoe
Why: billing exports the list by hand every month.
Done when: the list page has a link that downloads a CSV that opens in Excel.
Links: docs/design/2026-10-02-csv-export.md
```

- **No status field.** In progress means a branch or handoff exists; done means the file is gone. The branch that does the task deletes its file, so merging the branch closes the task.
- **`Assignee` is optional**, a team handle, never a full name or email. The agent never assigns or reassigns a task unless you ask. In a public repo the handles are public.
- **"What should I work on next?"** or **`/backlog`**: the `backlog` skill puts the current branch's handoff first, then lists the open tasks (title and assignee, no bodies) grouped as yours, unassigned and others, marks those in progress on another branch, and suggests one.
- **Open questions are tasks too** ("Decide whether archived items are exported"), done when the decision is recorded.
- **New task files** are written for the follow-ups and open questions of a finished branch, or when you ask.

One file per task, rather than a shared `ROADMAP.md`, is what keeps branches from editing the same lines.

### GitLab and GitHub issues

If `origin` is on GitLab or GitHub, setup proposes its issues as the task list, for example:

```markdown
- Tasks: GitLab issues of team/podcast (via glab; writes only with the user's confirmation).
```

- **Access** goes through the CLI, `glab` or `gh`, so it works with any agent. Log in once: `glab auth login` (`--hostname <host>` for a self-hosted GitLab) or `gh auth login`. If the CLI is not logged in, the agent asks whether you want to log in now (you run `! glab auth login` in Claude Code, or the command in a terminal, and it lists again); if not, it explains the steps and stops. It never asks for a token in the chat and never invents issues.
- **Reading** (`/backlog`, viewing an issue) runs without asking. **Writing** (create, close, comment, assign, label) is proposed with the exact command and runs only after you confirm.
- **`/backlog new <what>`** drafts the issue (title, Why, Done when, Links), asks for what it cannot infer instead of inventing it, checks for duplicates, and creates it after your yes. **`/backlog close <id>`** shows the issue, warns if it is in progress or assigned to someone else, and closes it after your yes. Both work with a task folder too, where they write or delete the file without asking, since git keeps it.
- **A new issue** has the shape of a task file: title, then Why, Done when and Links. No assignee unless you ask.
- **Closing:** when a branch's task is done, the agent gives you `Closes #42` for the merge request or pull request description, so the merge closes the issue. GitLab and GitHub honor it only for merges into the default branch: with git flow and `main` as default, an issue closed by a merge into `develop` stays open until the release, or you close it by hand.

Other trackers (Jira, ...) work the same way through a connector. With no task list, follow-ups go in the final message and the journal.

## Design decisions

Written when a branch's task is done, or earlier when you ask to record a decision: what a successor needs to know about why. Constraints, decisions not evident from the code, alternatives discarded and the reason. Not task logs, test counts or branch state: git has those.

A document that no longer holds is deleted (git keeps it). One that holds in part gets a box at the top, `> ⚠️ **Superseded …**`, saying what no longer holds and what does.

With `none`, decisions go in a comment next to the code they concern, in the README for decisions about the whole project, or in the commit message.

## When a branch's task is done

1. **Keep what must last.** Decisions and dead ends from the handoff that will matter after the branch go where people look: a comment next to the code, the design decisions, or a custom rule in `.ai/phase.md` if it is a rule to always follow. "It's in the journal" doesn't count: the journal gets buried.
2. **Close the task, file the rest.** The branch's task file is deleted; follow-ups and open questions become new tasks.
3. **Delete the handoff**, and write a journal entry naming what was moved and the new tasks.

## Years later

- **The journal grows, the cost doesn't.** Resuming reads only the newest journal file. Older entries are searched with `grep -rl <keyword> .ai/journal`, not read. The agent never deletes or summarizes old journals; prune them by hand if you want, git keeps them.
- **The debt list stays short.** Fixed items are deleted, accepted items stay with their reason, because they record a decision.
- **The phase history** in `.ai/phase.md` shows when and why the phase changed, and which phases were confirmed when the agent asked.

## Privacy

The files are readable by everyone with access to the repo. The agent never writes secrets, tokens, passwords, connection strings, customer data or personal data; it names them instead ("the staging API key in the team vault"). In a public repo, write as if the journal were public, because it is.
