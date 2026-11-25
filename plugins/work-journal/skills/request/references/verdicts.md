# Request: approving, requesting changes, merging

Part of the [request skill](../SKILL.md): read for `/request approve`, `/request changes` and `/request merge`, and the same in words. Its rules hold here too, above all [Writes need confirmation](../SKILL.md#writes-need-confirmation).

## Approving (`/request approve`)

An approval tells the team that a person checked the request. The agent records it; it never gives it. Run it only on the user's command, in this order:

1. **Read the request** as in [Showing](../SKILL.md#showing-request-id), step 1, with its head commit (GitHub `headRefOid`, GitLab `sha`).
2. **Say what stands in the way**, if anything: the user is its author (hosts refuse that, and it is not a check by someone else); it is a draft; checks failed or are running; conflicts; findings of a review in this conversation that should block the merge; open review comments; commits newer than the one tested or reviewed in this conversation (offer `/request review <id>` again). Go on only if the user still wants to.
3. **The tests nobody ran come first.** Take the last test or review of this request in the conversation:
   - steps `not run` or `failed`: list each one and ask whether a person has run it since, and with what result. Wait for the answer;
   - no test in this conversation: say so, and ask whether the request was tested elsewhere and how; offer `/request review <id>`.

   The answer must be about the tests: a "yes" to another question, or the approve command typed again, doesn't count. Go on when the user says each step was run and passed, or says in their own words that they approve without it; then name those steps as not tested in the confirmation of step 4. If a step failed for them too, stop and offer [Requesting changes](#requesting-changes-request-changes). Skip the question only when nothing is left: every step passed in this conversation on the head commit, or the user's command already says who ran the rest ("approve 12, I opened the file in Excel, fine").
4. **Confirm:** the request, the commit approved, what was tested by the agent and what by the user, and the exact command. Run it after the user's yes:
   - GitHub: `gh pr review <id> --approve`. Read `headRefOid` again just before: if it moved, stop and say so.
   - GitLab: `glab mr approve <id> --sha <head commit>`, which fails if new commits arrived.
5. **Report** the approval. Merging is a separate command, for whoever the request is assigned to: don't offer to run it.

A review not yet posted can go with it: offer the comment of [Reviewing](testing.md#reviewing-request-review), step 6.

## Requesting changes (`/request changes`)

The reviewer's no. The request stays open and its author is asked to change it: on both hosts "rejecting" a request means this, so "reject !12" in words is this command. Closing a request for good is done on the host.

1. **The reason is required**, and comes from the user: their words after the ID, kept in meaning. None given: propose the findings that should block the merge and the failed steps of the last review in this conversation, and let the user choose. Nothing to propose: ask. Never invent a reason.
2. **Write it for the author**, who was not in this conversation: what must change and where (file, line, step), how to see the problem (the command, what was expected, what came instead), in the language of the request. No shorthand from this session. Show it.
3. **Confirm** the text and the exact command, and run it after the user's yes:
   - GitHub: `gh pr review <id> --request-changes --body-file -`, with the text on stdin.
   - GitLab: `glab` has no command for it. Post the text as a comment ([Commenting](../SKILL.md#commenting-request-comment)); if the user had approved the request, add `glab mr revoke <id>` in the same confirmation. Say that the request is not marked "changes requested" this way, and that the Request changes button on the host does that.
4. **Report** the URL, and that the request stays open for its author.

## Merging (`/request merge`)

Merges the request on the host, into a branch others share: it can't be undone here. Only on the user's command, in this order:

1. **Read the request** as in [Showing](../SKILL.md#showing-request-id), step 1, with its head commit and who approved it (GitHub `latestReviews`; GitLab `glab api "projects/:id/merge_requests/<iid>/approvals"`).
2. **Whose merge it is:** the assignee's, or the author's when nobody is assigned. If the user is neither, say whose it is and ask whether they merge it all the same. This is a question of its own, also for a reviewer who has just approved the request: approving it didn't make it theirs. Wait for the answer; it doesn't count as the confirmation of step 5.
3. **Check, and report all problems at once.** With any, stop and ask; nothing here is forced:
   - approved by someone other than its author, and no changes requested;
   - not a draft; checks passed, none failed or still running; no conflicts with the base;
   - no open review comments;
   - the head commit is the one that was approved, where the host says (commits pushed after the approval: say so);
   - the base is not the default branch (`main`, `master`) or a release branch: if it is, ask once more, as in the finish skill.

   A problem the user accepts in their own words (no approval, in a project that asks for none) is named in the confirmation. What the host refuses stays refused: never `--admin`, never a way around a protected branch or a required check.
4. **How:** the way the user names (merge commit, squash, rebase). Otherwise GitLab uses the project's setting; GitHub needs a flag: `--merge` if the repository allows it (`gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`), else the only way allowed, else ask. The source branch is deleted only if the user asks (`--delete-branch`, `--remove-source-branch`) or the host is set to do it.
5. **Confirm:** the request, base ← branch, the commit, who approved it, the way, the problems accepted, and the exact command. Run it after the user's yes:
   - GitHub: `gh pr merge <id> --merge --match-head-commit <head commit>` (or `--squash`, `--rebase`).
   - GitLab: `glab mr merge <id> --sha <head commit> --auto-merge=false --yes` (add `--squash` or `--rebase` if asked). Leave out `--auto-merge=false` only if the user asks to merge when the pipeline passes.
6. **Report** the merged request and its URL. A Jira work item moves to Done by Jira automation or by hand, as in the finish skill.
7. **Offer the local cleanup**, if the branch exists here, and run it after a yes: `git switch <base>`, `git pull --ff-only`, `git branch -d <branch>`. Never `-D`, never the remote branch, never a push. A handoff of that branch still in the base means the request was not made by `/finish`: say so.
