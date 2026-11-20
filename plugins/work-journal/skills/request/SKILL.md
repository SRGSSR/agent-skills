---
name: request
description: "Lists, shows, edits, comments on and tests the merge requests (GitLab, `glab`) or pull requests (GitHub, `gh`) of the project. The listing puts first the requests waiting for the user's review, then their own, with the state of each (draft, checks, approvals, conflicts). Showing one gives its description, state and open review comments, and offers the review to a reviewer. Testing one runs the steps of its `How to test` part in a separate worktree, checks them against the specifications of the linked issues, and reports each step as passed, failed or not run. Use this skill whenever the user types `/request`, `/request <id>`, `/request edit`, `comment`, `test` or `help`, asks which merge or pull requests are open, what is waiting for their review, how a request is going or what the review said, asks to see, test or try one, or asks to change its title, description, reviewers, assignee or labels, mark it draft or ready, or comment on it. Not for creating one (`/finish mr` or `pr` does) or merging one."
license: MIT
argument-hint: "[<id> | edit | comment | test | help] ..."
metadata:
  version: "0.1.0"
---

# Request

A request is a GitLab merge request or a GitHub pull request. Commands:

- `/request`: the open requests, those waiting for the user's review first. See [What to show](#what-to-show).
- `/request <id>`: one request, with its state and open review comments. See [Showing](#showing-request-id).
- `/request edit <id> <change>`: change its title, description, reviewers, assignee, labels, or draft state. See [Editing](#editing-request-edit).
- `/request comment <id> <text>`: add a comment. See [Commenting](#commenting-request-comment).
- `/request test <id>`: run the tests its description asks for. See [Testing](#testing-request-test).
- `/request help`: this list of commands, with the host of `origin` and the CLI in use. Read only `git remote get-url origin`; run nothing else.

The same requests in words ("what is waiting for my review?", "show me !12", "add Simo as reviewer to #42", "mark !12 as ready", "test Anna's request") work the same way. An `<id>` is a number (`12`, `!12`, `#12`), a URL or a branch name; "this one" or no ID after a subcommand is the request of the current branch (`gh pr view`, `glab mr view` without an ID). After `/request`, a word that is neither a subcommand nor an ID is a person: only their requests, as author or reviewer.

Creating a request is `/finish mr` or `pr` ([finish skill](../finish/SKILL.md)), which checks the work first. This skill never merges, closes or approves a request, and never pushes: say that it is done on the host.

Talk in the user's language.

## Where the requests are

The host of `origin` decides: GitLab uses `glab mr`, GitHub uses `gh pr`. Another host: use its connector if there is one, otherwise say that this skill covers GitLab and GitHub. A CLI missing or not logged in: follow the backlog skill, [Not logged in](../backlog/SKILL.md#not-logged-in); never invent requests.

| Host | List with | The user is |
|---|---|---|
| GitHub | `gh pr list --json number,title,author,assignees,reviewRequests,reviewDecision,isDraft,mergeable,statusCheckRollup,headRefName,updatedAt --limit 100` | `gh api user --jq .login` |
| GitLab | `glab mr list -F json -P 100` (read `iid`, `title`, `author`, `assignees`, `reviewers`, `draft`, `has_conflicts`, `detailed_merge_status`, `source_branch`, `updated_at`) | `username` of `glab api user` |

A listing fetches at most 100: if it returns exactly that many, say there may be more.

## What to show

1. **To review, first:** the open requests where the user is a requested reviewer, oldest first. Leave the section out when there are none.
2. **Yours:** those the user wrote or is assigned to, the current branch's one first and marked as such.
3. **A table per section**, one row per request, no descriptions:
   - To review: request (`!12` on GitLab, `#12` on GitHub), title, author, state.
   - Yours: request, title, reviewers (`none` if nobody was asked), state.
   - Names are the handles of [`.ai/team.md`](../backlog/SKILL.md#people-aiteammd) if the project has it.
4. **State**, only what the listing gives, in a few words: `draft`, `checks failed` or `checks running`, `conflicts`, `approved`, `changes requested`; empty when it just waits for a review. GitLab's listing has no pipeline result: it shows in `/request <id>`.
5. **The others** in one line under the tables, as a count per author, unless the user asked for someone's requests.
6. End with one suggestion: the oldest request to review, with `/request <id>`; else one of the user's that needs them (changes requested, failed checks, conflicts); else none.
7. Last line: the other commands, `<id>`, `edit`, `comment`, `test`, `help`, in one line.

Listing only reads, so it needs no confirmation.

## Showing (`/request <id>`)

1. **Read it:**
   - GitHub: `gh pr view <id> --json number,title,body,author,assignees,reviewRequests,latestReviews,reviewDecision,isDraft,mergeable,statusCheckRollup,baseRefName,headRefName,isCrossRepository,closingIssuesReferences,comments,url`; the review comments on lines with `gh api "repos/{owner}/{repo}/pulls/<number>/comments"`. The CLI doesn't say which of them are resolved: say so.
   - GitLab: `glab mr view <id> -F json`, and the open discussions with `glab mr view <id> --unresolved`.
2. **Show**, in this order: title and URL; author, reviewers (with what each answered) and assignee; base ← branch; the state in one line (draft, checks, approvals, conflicts); the issues it closes; the description as it is; the open review comments, one line each (who, file and line, what they ask), newest first.
3. **Then the next step, by what the user is on it:**
   - A requested reviewer: ask whether to start the review now. On a yes, go on with [Testing](#testing-request-test).
   - The author, with changes requested, open comments, failed checks or conflicts: say what is asked, and offer to take it up on its branch (`/start <branch>` resumes it).
   - Otherwise nothing.

Showing only reads. Never check out the branch to show a request.

## Writes need confirmation

Editing or commenting on a request writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the change as before → after, or the comment text) with the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. If the user is not the author of the request, say so in the same message: a description or a title is the author's.

## Editing (`/request edit`)

1. **Read** the current values as in [Showing](#showing-request-id), step 1.
2. **Show the change** as before → after. Change only what the user asked for. A person comes from the backlog skill, [People](../backlog/SKILL.md#people-aiteammd).
3. **A description to rewrite** ("fix the description", "add how to test") gets the three parts of the finish skill, [The description](../finish/SKILL.md#the-description), from the request's commits and diff (`gh pr diff <id>`, `glab mr diff <id>`), its issues and the old text. What the old text says and is still true stays; what you can't find out is asked, never invented.
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

## Testing (`/request test`)

Runs what the request's description asks a tester to do, and says what happened. It tests; it does not judge the code, fix anything, approve or merge.

1. **Read the request** as in [Showing](#showing-request-id), step 1, and the issues it names (`gh issue view <id>`, `glab issue view <id>`; Jira and task files as in the [backlog skill](../backlog/SKILL.md)).
2. **Ask before running code from outside.** Testing runs the code of the branch on this machine. If the request comes from a fork (GitHub `isCrossRepository`; GitLab `source_project_id` different from `target_project_id`), say so and go on only after a yes. In a non-interactive run, stop there.
3. **The plan** is the `## How to test` part of the description: specifications, setup, steps, edge cases.
   - Check it against the issues: a specification of an issue (`Done when`, acceptance criteria) that no step covers gets a step of yours, marked `added`.
   - No such part: write the plan yourself from the issues, the diff and the project's test commands (`AGENTS.md`, `CLAUDE.md`, README, package scripts), show it, and say that the description gave none.
4. **Check out in a worktree of its own**, outside the repo, so the user's branch and uncommitted work are not touched: `git fetch origin pull/<number>/head` (GitHub) or `git fetch origin merge-requests/<iid>/head` (GitLab), then `git worktree add --detach <temp dir> FETCH_HEAD`. Work only there.
5. **Run** the setup, then every step and edge case in order, comparing what happens with what the plan expects:
   - commands (tests, build, scripts), HTTP calls, the output of a CLI and the content of files: run them;
   - steps in a user interface: only with a browser or UI tool at hand;
   - what needs a person (another program, a device, a judgment by eye) or what you could not do: `not run`, with the reason. Never guess the result of a step you did not run;
   - a failed step doesn't stop the others, except those that depend on it (`not run: step 2 failed`).

   Use only test data and the example configuration (`.env.example`); a step that needs real credentials, production data or a real external effect (an email sent, a payment, a deploy) is `not run`. Change, commit and push nothing in the worktree, even to make a step pass.
6. **Clean up:** stop the servers you started, then `git worktree remove --force <temp dir>` (it is your own temporary copy; `--force` only drops the build output in it).
7. **Report:** the commit tested, then a table with one row per step and edge case: what was done, the result (`passed`, `failed`, `not run`), and in one line what happened; for a failure, what was expected, what came instead and the lines of output that show it. Under it: the specifications no step of the description covered, and a count (`5 passed, 1 failed, 2 not run`). Say "tested" only of what ran.
8. **Offer to post the report** as a comment on the request ([Commenting](#commenting-request-comment), with its confirmation). Nothing is posted without a yes.
