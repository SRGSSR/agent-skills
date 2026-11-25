---
name: request
description: "Lists, shows, edits, comments on, tests and reviews the merge requests (GitLab, `glab`) or pull requests (GitHub, `gh`) of the project, records the reviewer's verdict and merges them. The listing puts first the approved requests assigned to the user, then those waiting for their review, with the state of each. Testing one runs the steps of its `How to test` part in a separate worktree and reports each as passed, failed or not run; reviewing one adds a read of the diff against the linked issues. Use this skill whenever the user types `/request`, `/request <id>`, `/request edit`, `comment`, `test`, `review`, `approve`, `changes`, `merge` or `help`, asks which merge or pull requests are open, what is waiting for their review, or what the review said, asks to see, test, review, approve, reject or merge one or to request changes on it, or asks to change its title, description, reviewers, assignee or labels, mark it draft or ready, or comment on it. Not for creating one (`/finish mr` or `pr` does)."
license: MIT
argument-hint: "[<id> | edit | comment | test | review | approve | changes | merge | help] ..."
metadata:
  version: "0.2.0"
---

# Request

A request is a GitLab merge request or a GitHub pull request. Commands:

- `/request`: the open requests: those the user can merge, those waiting for their review, then the rest. See [What to show](#what-to-show).
- `/request <id>`: one request, with its state and open review comments. See [Showing](#showing-request-id).
- `/request edit <id> <change>`: change its title, description, reviewers, assignee, labels, or draft state. See [Editing](#editing-request-edit).
- `/request comment <id> <text>`: add a comment. See [Commenting](#commenting-request-comment).
- `/request test <id>`: run the tests its description asks for. See [Testing](references/testing.md#testing-request-test).
- `/request review <id>`: the reviewer's whole path: show, test, read the diff, report. See [Reviewing](references/testing.md#reviewing-request-review).
- `/request approve <id>`: the reviewer's yes. See [Approving](references/verdicts.md#approving-request-approve).
- `/request changes <id> <reason>`: the reviewer's no: asks the author for changes. See [Requesting changes](references/verdicts.md#requesting-changes-request-changes).
- `/request merge <id>`: merge an approved request on the host. See [Merging](references/verdicts.md#merging-request-merge).
- `/request help`: this list of commands, with the host of `origin` and the CLI in use. Read only `git remote get-url origin`; run nothing else.

The same requests in words ("what is waiting for my review?", "show me !12", "add Simo as reviewer to #42", "mark !12 as ready", "test Anna's request", "review !12", "approve it", "send it back: the archived items are still exported") work the same way. An `<id>` is a number (`12`, `!12`, `#12`), a URL or a branch name; "this one" or no ID after a subcommand is the request of the current branch (`gh pr view`, `glab mr view` without an ID). After `/request`, a word that is neither a subcommand nor an ID is a person: only their requests, as author or reviewer.

Creating a request is `/finish mr` or `pr` ([finish skill](../finish/SKILL.md)), which checks the work first. This skill never closes a request and never pushes: say that closing is done on the host. It approves, asks for changes or merges only when the user gives that command, never as the outcome of a review it ran: a review can recommend asking for changes, but doesn't do it.

This file covers listing, showing, editing and commenting. Read the reference files only when the request needs them, and before acting on it:

- [`references/testing.md`](references/testing.md): `test` and `review`.
- [`references/verdicts.md`](references/verdicts.md): `approve`, `changes` and `merge`.

Talk in the user's language.

## Where the requests are

The host of `origin` decides: GitLab uses `glab mr`, GitHub uses `gh pr`. Another host: use its connector if there is one, otherwise say that this skill covers GitLab and GitHub. A CLI missing or not logged in: follow the backlog skill, [Not logged in](../backlog/SKILL.md#not-logged-in); never invent requests.

| Host | List with | The user is |
|---|---|---|
| GitHub | `gh pr list`, below | `gh api user --jq .login` |
| GitLab | `glab mr list`, below | `glab api user --jq .username` |

One line per request, with only the fields the listing needs (the full JSON carries every description and check run):

```sh
gh pr list --limit 100 --json number,title,author,assignees,reviewRequests,reviewDecision,isDraft,mergeable,statusCheckRollup,headRefName,updatedAt --jq '(["number","title","author","assignees","reviewers","decision","draft","mergeable","checks","branch","updated"] | @tsv), (.[] | [.number, .title, .author.login, ([.assignees[].login] | join(",")), ([.reviewRequests[] | (.login // .name)] | join(",")), (.reviewDecision // ""), .isDraft, .mergeable, ([.statusCheckRollup[] | (.conclusion // .state // "")] as $c | if ($c | length) == 0 then "" elif any($c[]; . == "FAILURE" or . == "ERROR" or . == "TIMED_OUT" or . == "CANCELLED" or . == "ACTION_REQUIRED" or . == "STARTUP_FAILURE") then "failed" elif any($c[]; . == "" or . == "PENDING" or . == "EXPECTED") then "running" else "passed" end), .headRefName, .updatedAt[:10]] | @tsv)'
glab mr list -P 100 -F json --jq '(["iid","title","author","assignees","reviewers","draft","conflicts","merge_status","branch","updated"] | @tsv), (.[] | [.iid, .title, .author.username, ([.assignees[].username] | join(",")), ([.reviewers[].username] | join(",")), .draft, .has_conflicts, .detailed_merge_status, .source_branch, .updated_at[:10]] | @tsv)'
```

A `glab` too old for `--jq`: `glab mr list -P 100` (a text list), then `glab mr view <id>` for the few the listing needs more about. Never read the full JSON.

A listing fetches at most 100: if it returns exactly that many (after the header line), say there may be more.

## What to show

1. **To merge, first:** the open requests assigned to the user that are approved, oldest first. Approved is GitHub's `reviewDecision` `APPROVED`; GitLab's listing doesn't say, so for each request assigned to the user read `approved` from `glab api "projects/:id/merge_requests/<iid>/approvals"`.
2. **To review:** those where the user is a requested reviewer, oldest first.
3. **Yours:** the other ones the user wrote or is assigned to, the current branch's one first and marked as such.
4. **A table per section**, one row per request, no descriptions; leave out a section with no rows:
   - To merge: request (`!12` on GitLab, `#12` on GitHub), title, approved by, state.
   - To review: request, title, author, state.
   - Yours: request, title, reviewers (`none` if nobody was asked), state.
   - Names are the handles of [`.ai/team.md`](../backlog/references/team.md#people-aiteammd) if the project has it.
5. **State**, only what the listing gives, in a few words: `draft`, `checks failed` or `checks running`, `conflicts`, `approved`, `changes requested`; empty when it just waits for a review. GitLab's listing has no pipeline result: it shows in `/request <id>`.
6. **The others** in one line under the tables, as a count per author, unless the user asked for someone's requests.
7. End with one suggestion: the oldest request to merge with nothing in its state, with `/request merge <id>`; else the oldest to review, with `/request <id>`; else one of the user's that needs them (changes requested, failed checks, conflicts); else none.
8. Last line: the other commands, `<id>`, `edit`, `comment`, `test`, `review`, `approve`, `changes`, `merge`, `help`, in one line.

Listing only reads, so it needs no confirmation.

## Showing (`/request <id>`)

1. **Read it:**
   - GitHub: `gh pr view <id> --json number,title,body,author,assignees,reviewRequests,latestReviews,reviewDecision,isDraft,mergeable,statusCheckRollup,baseRefName,headRefName,isCrossRepository,closingIssuesReferences,comments,url`; the review comments on lines with `gh api "repos/{owner}/{repo}/pulls/<number>/comments"`. The CLI doesn't say which of them are resolved: say so.
   - GitLab: `glab mr view <id> -F json`, and the open discussions with `glab mr view <id> --unresolved`.
2. **Show**, in this order: title and URL; author, reviewers (with what each answered) and assignee; base ← branch; the state in one line (draft, checks, approvals, conflicts); the issues it closes; the description as it is; the open review comments, one line each (who, file and line, what they ask), newest first.
3. **Then the next step, by what the user is on it:**
   - A requested reviewer: ask whether to start the review now. On a yes, go on with [Reviewing](references/testing.md#reviewing-request-review), from its step 2.
   - The author, with changes requested, open comments, failed checks or conflicts: say what is asked, and offer to take it up on its branch (`/start <branch>` resumes it).
   - Otherwise nothing.

Showing only reads. Never check out the branch to show a request.

## Writes need confirmation

Editing, commenting on, approving, asking for changes on or merging a request writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the change as before → after, the comment text, or the verdict with the commit it is given on) with the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. If the user is not the author of the request, say so in the same message: a description or a title is the author's.

## Editing (`/request edit`)

1. **Read** the current values as in [Showing](#showing-request-id), step 1.
2. **Show the change** as before → after. Change only what the user asked for. A person comes from the backlog skill, [People](../backlog/references/team.md#people-aiteammd).
3. **A description to rewrite** ("fix the description", "add how to test") gets the three parts of the finish skill, [The description](../finish/references/merge-request.md#the-description), from the request's commits and diff (`gh pr diff <id>`, `glab mr diff <id>`), its issues and the old text. What the old text says and is still true stays; what you can't find out is asked, never invented.
4. **Edit:**
   - GitHub: `gh pr edit <id>` with `--title`, `--body-file -` (body on stdin), `--add-reviewer`, `--remove-reviewer`, `--add-assignee`, `--remove-assignee` (`@me` for the user), `--add-label`, `--remove-label`. Draft: `gh pr ready <id>`, and `gh pr ready <id> --undo` to go back to draft.
   - GitLab: `glab mr update <id> --yes` with `--title`, `--description-file -` (body on stdin), `--reviewer` and `--assignee` (`+name` adds, `-name` removes; a bare name replaces everyone there, so use it only when the user asks for that), `--label`, `--unlabel`, `--draft`, `--ready`.
5. **Report** what changed, with the URL.

The target branch is not changed here: it decides where the work lands, and is changed on the host.

## Commenting (`/request comment`)

1. **Write the comment** from the user's words: keep their meaning, fix only typos, add nothing they did not say. If the user asked you to write it, draft it and show it. Point to commits and files instead of pasting diffs or logs; never put secrets, tokens or personal data in a comment.
2. **Post:**
   - GitHub: `gh pr comment <id> --body-file -`, with the text on stdin.
   - GitLab: `glab mr note create <id> -m "<text>"` (a `glab` without `note create`: `glab mr note <id> -m "<text>"`); for more than one line, pass the text through a quoted heredoc (`-m "$(cat <<'EOF' ... EOF)"`).
3. **Report** the comment URL from the command output.

