---
name: pause
description: "Pauses the work on the current branch without closing it. It checks that everything a successor needs is written down (status, next steps, decisions and their reasons, dead ends, problems, open questions, uncommitted changes, what exists only in the conversation), asks the user about what is unclear, then rewrites the branch's handoff, adds a journal entry and commits them, so that `/start` or \"where were we?\" in a new session, another tool or another person picks up exactly where it stopped. Use this skill whenever the user types `/pause`, with or without `help` or instructions after it, or asks to pause, park, suspend or put on hold the task, feature or branch they are working on. Part of the work-journal plugin; `/start` begins or resumes the work, `/finish` ends it."
license: MIT
argument-hint: "[help | instructions]"
metadata:
  version: "0.1.0"
---

# Pause

`/pause [instructions]` stops the work on the current branch and leaves it open: the branch, its task and its handoff stay, and the handoff says everything the next session needs. It is the checked version of "let's stop here": the [work-journal skill](../work-journal/SKILL.md) writes a handoff whenever work stops, `/pause` first checks that nothing is missing from it and asks about what it can't tell.

It works on any branch, also the development one: the handoff is per branch. If the work is done, say so and suggest `/finish` instead; pause only if the user still wants to.

`/pause help` shows, in a few lines, what gets checked (step 1), what is written and committed, and how to resume. Read nothing and run nothing.

Text after `/pause` is instructions for this run: why the work stops and when or by whom it resumes ("until billing answers", "Anna takes over on Monday"), something to add to the handoff, an answer given in advance ("commit everything as wip", "don't commit"). Follow them; they answer the matching question of step 2, so don't ask it again. They never lift the rules here: no push, no stash, no secrets in the files.

Never push, never stash, never discard changes. Formats are in the work-journal skill; tracker commands in the [backlog skill](../backlog/SKILL.md). Talk in the user's language.

## 1. Check what is written down

Compare three things: the conversation of this session, the repo (`git status --short`, `git log --oneline` since the handoff's `Last commit`, `git stash list`), and what is already in the handoff and in today's journal entries. For each point, the question is whether a reader who was not here would find it in the files:

- **Goal:** the goal and the done condition, as they are now (they may have changed while working).
- **Status:** what is done, half done and not started matches the code. Half-done work says exactly where it stops (file, function, what works and what doesn't).
- **Next steps:** in order; the first one can be started without asking anything.
- **Decisions:** every choice made in this session, by the user or by you, with its reason. A choice the user made in the conversation is the easiest to lose.
- **Dead ends:** what was tried and dropped, and why.
- **Problems:** failing tests, known bugs, errors not yet understood, things that work only by chance, blockers.
- **Pending:** what waits on someone or something (an answer, an access, a review, a release), and who or what.
- **Open questions:** for the user and for others, with the options already discussed.
- **Uncommitted changes:** each file, and whether it is part of the work.
- **Outside the repo:** what the next session can't see, a stash, a local database or config changed by hand, a server or job left running, a file in a temp folder. Stop what you started; name the rest.
- **How to verify:** the commands, and what is expected to fail for now.

## 2. Ask, if something is unclear

Ask only what you can't settle from the conversation and the repo, all in one message, then wait:

- uncommitted changes: commit them on the branch as work in progress (`wip: <what>`), or leave them in the working tree. Recommend the commit when another machine, tool or person may continue, since only commits travel. On the development or default branch, recommend leaving them;
- a decision whose reason you don't know, or a result you aren't sure about ("did the import work on staging?");
- an open question the user can answer right now, so it doesn't wait in the handoff;
- why the work stops and when it resumes, only if it changes the next steps (waiting for an answer is a blocker, the end of the day is not).

With nothing to ask, don't ask: go on.

## 3. Write

1. **Handoff:** rewrite `.ai/handoff/<branch>.md` in the work-journal format with everything from step 1, keeping `Base:`. Problems go under Status or Next steps where they bite, pending items and questions under Open questions. If the user said why the work stops or when it resumes, add a header line `Paused: <date> · <reason> · <resume when or by whom>` (the next rewrite drops it). Then run the format's own test: could a different model, in a different tool, continue from this file plus the repo, without the conversation?
2. **What can't wait in a handoff:** a decision that already binds other branches or people goes to the design decisions now, as the work-journal skill describes, with a pointer in the handoff.
3. **Journal entry:** `## HH:MM · tool/model · <branch> · pause`, with what the session did, decided and dropped that isn't in an entry yet, and `Next:` the first step.
4. **Commit** the handoff and the entry (`pause: <task or branch>`), together with the work-in-progress changes if the user chose so. On the development or default branch, commit only with the user's yes. A `wip:` commit is named in the handoff, so the next session knows the code in it is unfinished.
5. **Tracker task:** nothing changes, it stays assigned and in progress. A comment on it or a status change only if the user asks, with the confirmation the backlog skill requires.

## 4. Report

A few lines: what was written and committed (or left uncommitted, and which files), the first next step, the open questions and what the work waits on, and how to resume: `/start <task>` or "where were we?" on this branch. If the branch has commits that are not on its remote, or no remote branch, give `git push -u origin <branch>` for the user to run when someone else or another machine continues.
