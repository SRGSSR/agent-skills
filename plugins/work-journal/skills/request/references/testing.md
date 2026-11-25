# Request: testing and reviewing

Part of the [request skill](../SKILL.md): read for `/request test` and `/request review`, and the same in words. Its rules hold here too, above all [Writes need confirmation](../SKILL.md#writes-need-confirmation).

## Testing (`/request test`)

Runs what the request's description asks a tester to do, and says what happened. It tests; it does not judge the code, fix anything, approve or merge.

1. **Read the request** as in [Showing](../SKILL.md#showing-request-id), step 1, and the issues it names (`gh issue view <id>`, `glab issue view <id>`; Jira and task files as in the [backlog skill](../../backlog/SKILL.md)).
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
8. **Offer to post the report** as a comment on the request ([Commenting](../SKILL.md#commenting-request-comment), with its confirmation). Nothing is posted without a yes.

## Reviewing (`/request review`)

The whole path of a reviewer in one command. It prepares the review; the verdict stays with the person, and the agent recommends one only when it is to ask for changes.

1. **Show the request** as in [Showing](../SKILL.md#showing-request-id), steps 1 and 2. If the user wrote it, say that a review by its author is not the check by someone else, and go on only if they want it.
2. **Test it** as in [Testing](#testing-request-test), steps 1 to 7.
3. **Read the diff** (`gh pr diff <id>`, `glab mr diff <id>`) against the issues and the description, for what running the steps cannot show:
   - a specification of an issue that is not implemented, or only in part;
   - changes the description doesn't mention, or that don't belong to the issue;
   - something new a user can see (command, option, config, behavior) that the docs don't describe;
   - new behavior with no automated test;
   - a rule of the project (`AGENTS.md`, `CLAUDE.md`) the change breaks;
   - leftovers: secrets, debug output, commented-out code.

   One line per finding: file and line, what it is, why it matters. This is not a line-by-line hunt for bugs, which is the job of a code review tool. Having nothing to report is a fine result: never invent a finding to have one.
4. **Report**, in this order: the test table and its count; the findings, those that should block the merge first, then those to consider; what is left for the reviewer to do by hand (the steps not run). Then the conclusion, one of two:
   - a step failed, or a finding should block the merge: recommend `/request changes <id>`, and give the reasons as the text for the author ([Requesting changes](verdicts.md#requesting-changes-request-changes), step 2), ready to send;
   - nothing blocks: say that you found nothing that blocks, then what is still missing before `/request approve <id>` (each step not run, and a read of the code). Never recommend approving: you did not read the code for bugs, and a step you could not run is not a step that passed.
5. **Suggest a code review tool** for the code itself, if the agent has one (in Claude Code, `/code-review`): this review ran the plan and compared the change with what was asked, that one reads the code for bugs. Only suggest it; don't run it unasked.
6. **Offer to post the review** as one comment on the request ([Commenting](../SKILL.md#commenting-request-comment), with its confirmation): the test table and the findings, without the suggestions meant for the user.

