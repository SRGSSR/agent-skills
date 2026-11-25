# Finish: merge or pull request

Part of the [finish skill](../SKILL.md): read for `/finish mr` and `/finish pr`, after its checks (step 1) and before step 2, which deletes the task file and the handoff the description is built from.

## `mr`, `pr`

- `mr` uses `glab`, `pr` uses `gh`; if it doesn't match the host of `origin`, say so and ask. Not logged in: see the backlog skill, [Not logged in](../../backlog/SKILL.md#not-logged-in).
- The branch must be on the remote and up to date (`git status -sb`). If it isn't, give the user `git push -u origin <branch>` in the same message as the title, body and command below (one stop, not two), and create nothing until they say it is pushed. Never pass `--push` or `--fill`, which push.
- **Title:** the task title, after the Jira key if there is one (`PODCAST-42 CSV export`).
- **Body:** see [The description](#the-description). Draft it before step 2 deletes the task file and the handoff it is built from.
- **Reviewer and assignee** are two things: the reviewer checks and approves the request, the assignee carries it to the merge (often the author). Each one named in the instructions (a person, "me", "nobody"): follow them. For each one they don't name, ask in the same message, as one question: who reviews it (someone, nobody), and whom to assign it to (the user, someone else, nobody). Never pick either yourself, and never propose the user as their own reviewer. A name is resolved as in the backlog skill, [People](../../backlog/references/team.md#people-aiteammd). The flags are `--reviewer <handle>` and `--assignee <handle>` for both tools (`gh`: `@me` for the user as assignee; `glab`: the username `glab auth status` shows).
- Show title, body and the exact command, and run it after the user's yes:
  - `gh pr create --base <base> --title "<title>" --body-file -`, body on stdin;
  - `glab mr create --target-branch <base> --title "<title>" --description-file - --yes`, body on stdin.
- The commit of step 2 is part of the request, so merging it closes everything. If the review asks for changes, the next agent on the branch writes a new handoff. A Jira work item moves to Done after the merge, by Jira automation or by hand (`acli jira workitem transition`).
- Report the URL.

## The description

The reviewer was not in the conversation and may test the work days later: the description alone must tell them what it is, what changed and how to check it. Three parts, in this order, in the language of the project's issues and commits:

1. **Introduction**, no heading, two to four lines: what the request does and why. Someone who stops reading here knows what they are approving.
2. **`## Changes`**, in detail: what changed and where (files, components, pages, commands, config), grouped by area for a large branch; the decisions a reviewer would question, each with its reason; what was left out on purpose; what needs care when merging (migration, new config or dependency, changed public behavior). From the commits, `git diff --stat <base>...HEAD`, the handoff and the journal.
3. **`## How to test`**, everything a tester needs, with no question left to ask:
   - **Specifications:** what the work had to do: the task's `Done when` or acceptance criteria, one line each, with a link to every issue it comes from (`#42` on the same host, the full URL elsewhere, the Jira key). No written specification: say so and give the handoff's goal.
   - **Setup:** what is needed first (install, config, data, migration, accounts), if anything.
   - **Steps:** numbered, each with what to do and what must happen. First the automated tests (the command, what they cover), then by hand what they don't cover, one step per specification line.
   - **Edge cases:** those the work handles (empty or very large input, invalid values, limits, permissions, errors, old data), each with how to try it and the expected result; then those it does not handle or that nobody tried, said as such.

Last, `Closes #42` for each issue on the same host, or the Jira key.

Write only what is true: a step nobody ran is marked "not run", a specification with no link gets none, and nothing is invented to fill a part. A small change gets short parts, but all three: a part with nothing to say says so in one line. Check failures the user accepted go under Changes.
