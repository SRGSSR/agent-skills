---
name: request
description: "Lists, shows, edits, comments on, tests and reviews the merge requests (GitLab, `glab`) or pull requests (GitHub, `gh`) of the project, and records the reviewer's verdict. The listing puts first the requests waiting for the user's review, then their own, with the state of each. Testing one runs the steps of its `How to test` part in a separate worktree and reports each as passed, failed or not run; reviewing one adds a read of the diff against the linked issues. Use this skill whenever the user types `/request`, `/request <id>`, `/request edit`, `comment`, `test`, `review`, `approve`, `changes` or `help`, asks which merge or pull requests are open, what is waiting for their review, how a request is going or what the review said, asks to see, test, review, approve or reject one or to request changes on it, or asks to change its title, description, reviewers, assignee or labels, mark it draft or ready, or comment on it. Not for creating one (`/finish mr` or `pr` does) or merging one."
license: MIT
argument-hint: "[<id> | edit | comment | test | review | approve | changes | help] ..."
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
- `/request review <id>`: the reviewer's whole path: show, test, read the diff, report. See [Reviewing](#reviewing-request-review).
- `/request approve <id>`: the reviewer's yes. See [Approving](#approving-request-approve).
- `/request changes <id> <reason>`: the reviewer's no: asks the author for changes. See [Requesting changes](#requesting-changes-request-changes).
- `/request help`: this list of commands, with the host of `origin` and the CLI in use. Read only `git remote get-url origin`; run nothing else.

The same requests in words ("what is waiting for my review?", "show me !12", "add Simo as reviewer to #42", "mark !12 as ready", "test Anna's request", "review !12", "approve it", "send it back: the archived items are still exported") work the same way. An `<id>` is a number (`12`, `!12`, `#12`), a URL or a branch name; "this one" or no ID after a subcommand is the request of the current branch (`gh pr view`, `glab mr view` without an ID). After `/request`, a word that is neither a subcommand nor an ID is a person: only their requests, as author or reviewer.

Creating a request is `/finish mr` or `pr` ([finish skill](../finish/SKILL.md)), which checks the work first. This skill never merges or closes a request and never pushes: say that it is done on the host. It approves or asks for changes only when the user gives that command, never as the outcome of a review it ran.

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
7. Last line: the other commands, `<id>`, `edit`, `comment`, `test`, `review`, `approve`, `changes`, `help`, in one line.

Listing only reads, so it needs no confirmation.

## Showing (`/request <id>`)

1. **Read it:**
   - GitHub: `gh pr view <id> --json number,title,body,author,assignees,reviewRequests,latestReviews,reviewDecision,isDraft,mergeable,statusCheckRollup,baseRefName,headRefName,isCrossRepository,closingIssuesReferences,comments,url`; the review comments on lines with `gh api "repos/{owner}/{repo}/pulls/<number>/comments"`. The CLI doesn't say which of them are resolved: say so.
   - GitLab: `glab mr view <id> -F json`, and the open discussions with `glab mr view <id> --unresolved`.
2. **Show**, in this order: title and URL; author, reviewers (with what each answered) and assignee; base ← branch; the state in one line (draft, checks, approvals, conflicts); the issues it closes; the description as it is; the open review comments, one line each (who, file and line, what they ask), newest first.
3. **Then the next step, by what the user is on it:**
   - A requested reviewer: ask whether to start the review now. On a yes, go on with [Reviewing](#reviewing-request-review), from its step 2.
   - The author, with changes requested, open comments, failed checks or conflicts: say what is asked, and offer to take it up on its branch (`/start <branch>` resumes it).
   - Otherwise nothing.

Showing only reads. Never check out the branch to show a request.

## Writes need confirmation

Editing, commenting on, approving or asking for changes on a request writes outside the repo, where others are notified. Even when the user typed the command, show what will happen (the change as before → after, the comment text, or the verdict with the commit it is given on) with the exact command, and run it only after the user confirms. In a non-interactive run, put both in the final message and run nothing. If the user is not the author of the request, say so in the same message: a description or a title is the author's.

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

## Reviewing (`/request review`)

The whole path of a reviewer in one command. It prepares the review; the verdict stays with the person.

1. **Show the request** as in [Showing](#showing-request-id), steps 1 and 2. If the user wrote it, say that a review by its author is not the check by someone else, and go on only if they want it.
2. **Test it** as in [Testing](#testing-request-test), steps 1 to 7.
3. **Read the diff** (`gh pr diff <id>`, `glab mr diff <id>`) against the issues and the description, for what running the steps cannot show:
   - a specification of an issue that is not implemented, or only in part;
   - changes the description doesn't mention, or that don't belong to the issue;
   - something new a user can see (command, option, config, behavior) that the docs don't describe;
   - new behavior with no automated test;
   - a rule of the project (`AGENTS.md`, `CLAUDE.md`) the change breaks;
   - leftovers: secrets, debug output, commented-out code.

   One line per finding: file and line, what it is, why it matters. This is not a line-by-line hunt for bugs, which is the job of a code review tool. Having nothing to report is a fine result: never invent a finding to have one.
4. **Report**, in this order: the test table and its count; the findings, those that should block the merge first, then those to consider; what is left for the reviewer to do by hand (the steps not run). No verdict of your own: end with the two commands the reviewer has, `/request approve <id>` and `/request changes <id> <reason>`, without recommending either.
5. **Suggest a code review tool** for the code itself, if the agent has one (in Claude Code, `/code-review`): this review ran the plan and compared the change with what was asked, that one reads the code for bugs. Only suggest it; don't run it unasked.
6. **Offer to post the review** as one comment on the request ([Commenting](#commenting-request-comment), with its confirmation): the test table and the findings, without the suggestions meant for the user.

## Approving (`/request approve`)

An approval tells the team that a person checked the request. The agent records it; it never gives it. Run it only on the user's command, in this order:

1. **Read the request** as in [Showing](#showing-request-id), step 1, with its head commit (GitHub `headRefOid`, GitLab `sha`).
2. **Say what stands in the way**, if anything: the user is its author (hosts refuse that, and it is not a check by someone else); it is a draft; checks failed or are running; conflicts; findings of a review in this conversation that should block the merge; open review comments; commits newer than the one tested or reviewed in this conversation (offer `/request review <id>` again). Go on only if the user still wants to.
3. **The tests nobody ran come first.** Take the last test or review of this request in the conversation:
   - steps `not run` or `failed`: list each one and ask whether a person has run it since, and with what result. Wait for the answer;
   - no test in this conversation: say so, and ask whether the request was tested elsewhere and how; offer `/request review <id>`.

   The answer must be about the tests: a "yes" to another question, or the approve command typed again, doesn't count. Go on when the user says each step was run and passed, or says in their own words that they approve without it; then name those steps as not tested in the confirmation of step 4. If a step failed for them too, stop and offer [Requesting changes](#requesting-changes-request-changes). Skip the question only when nothing is left: every step passed in this conversation on the head commit, or the user's command already says who ran the rest ("approve 12, I opened the file in Excel, fine").
4. **Confirm:** the request, the commit approved, what was tested by the agent and what by the user, and the exact command. Run it after the user's yes:
   - GitHub: `gh pr review <id> --approve`. Read `headRefOid` again just before: if it moved, stop and say so.
   - GitLab: `glab mr approve <id> --sha <head commit>`, which fails if new commits arrived.
5. **Report** the approval, and that merging is still to be done on the host.

A review not yet posted can go with it: offer the comment of [Reviewing](#reviewing-request-review), step 6.

## Requesting changes (`/request changes`)

The reviewer's no. The request stays open and its author is asked to change it: on both hosts "rejecting" a request means this, so "reject !12" in words is this command. Closing a request for good is done on the host.

1. **The reason is required**, and comes from the user: their words after the ID, kept in meaning. None given: propose the findings that should block the merge and the failed steps of the last review in this conversation, and let the user choose. Nothing to propose: ask. Never invent a reason.
2. **Write it for the author**, who was not in this conversation: what must change and where (file, line, step), how to see the problem (the command, what was expected, what came instead), in the language of the request. No shorthand from this session. Show it.
3. **Confirm** the text and the exact command, and run it after the user's yes:
   - GitHub: `gh pr review <id> --request-changes --body-file -`, with the text on stdin.
   - GitLab: `glab` has no command for it. Post the text as a comment ([Commenting](#commenting-request-comment)); if the user had approved the request, add `glab mr revoke <id>` in the same confirmation. Say that the request is not marked "changes requested" this way, and that the Request changes button on the host does that.
4. **Report** the URL, and that the request stays open for its author.
