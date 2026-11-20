# Handoff
Updated: 2026-11-20 23:13 · by: claude-code/claude-fable-5-2
Branch: feature/request · Base: develop · Last commit: see `git log -1` · Uncommitted: none
Phase: stabilize

## Goal
A `request` skill in the work-journal plugin: `/request` handles GitLab merge requests and GitHub pull requests the way `/backlog` handles tasks, and automates the tests a request's description asks for.

## Status
- [x] `request` 0.1.0: `/request`, `/request <id>`, `edit`, `comment`, `test`, `help` (`plugins/work-journal/skills/request/SKILL.md`), plugin 0.22.0
- [x] READMEs, `teams.md` "Request commands", `docs/design.md`, `AGENTS.md`, manifests, `evals/run-prompt.md`
- [x] Evals 51 request-help and 52 request-list-gitlab, with graders
- [x] `/request review <id>`: show, test, read the diff against the issues, report, suggest a code review tool, offer to post; recommends `changes` when something blocks, never `approve`
- [x] `/request approve <id>` (asks about the steps not run first, approves the tested commit) and `/request changes <id> <reason>`

## Next steps
1. Agree `/request merge` with the user (proposal made: for whoever carries the request, with checks before and a confirmation), or `/finish`.

## Decisions
- The reviewer's no is `/request changes`, not `reject` (user, confirmed): reasons in `docs/design.md`.
- Requests waiting for the user's review are listed first; `show` is implicit (user). Reasons for the command set in `docs/design.md`, "Trackers and /backlog".

## Dead ends
None.

## Open questions
- `/request merge`: the user wants to discuss it; not designed.

## How to verify
- `npm install --no-save yaml@2.9.1 && node scripts/check-skills.mjs`
- `claude plugin validate --strict .` and `claude plugin validate --strict --profile directory` on each `plugins/*/`
- Not run: evals 51 and 52 with a real agent; nothing was tried against a live GitLab or GitHub.
