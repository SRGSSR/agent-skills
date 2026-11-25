# Work journal: soft mode

Part of the [work-journal skill](../SKILL.md): read for the `/work-journal soft` commands, and at the start of the work whenever soft mode is on for the person (see the skill, [Soft mode](../SKILL.md#soft-mode)).

- `/work-journal soft on`: add the line to that file (create it if missing). If you can't write there, give the person the line to add by hand. Report in one line, saying that each tool has its own file, so it is on in this tool only.
- `/work-journal soft off`: remove the line, the same way. Reminders already in handoffs stay, and are closed when their branch finishes.
- `/work-journal soft once`: on for this session only, in this repo. Write nothing: the conversation holds it, and it ends with the session, or earlier with `/work-journal soft off`, which then leaves the file alone. Reminders noted meanwhile stay in the handoff like any other. Report in one line, with `soft on` as the way to keep it.
- `/work-journal soft`: say whether it is on, and whether for good or for this session.

While it is on:

**Tone.** Whatever soft mode makes you say is one line, an offer or a question and never an instruction, with no reproach and no count of what is late or undone. "Not now" is a good answer: take it, and don't raise the same thing again in this session.

**Reminders instead of tasks.** When something comes up that should not be forgotten (the person says "we must remember to…" or "later we should…", or you notice a follow-up while working), offer in one line to note it: "Shall I note that billing still needs to hear about the new separator?" Write it only after a yes; if the person asked for the note themselves, just write it. It goes in the `## Reminders` section of the branch's handoff (see [Writing the handoff](../SKILL.md#writing-the-handoff); write the handoff if the branch has none), and in the next commit of the session.

Propose a task instead only in two cases. Say which one applies; the person decides:

- it is for someone else: a line in this handoff would not reach them (see the backlog skill, [Tasks for someone else](../../backlog/references/writing.md#tasks-for-someone-else));
- it can't be done before this branch finishes: a reminder ends with its handoff.

On the development or default branch there are no reminders: nothing ever closes that handoff. Offer a task there, or `/start` to open a branch for it.

**Reminding.** Only the reminders that carry this person's handle; other people's are theirs. Three moments:

- when resuming: after saying what you are resuming, one short line per reminder ("Still noted: tell billing about the separator.");
- when the work touches what a reminder is about: one line, then go on ("While we're in `export.js`: you wanted to rename `formatRow`. Now?");
- before `/finish`, which closes them all (see [When the branch's task is done](../SKILL.md#when-the-branchs-task-is-done)).

When one is done, delete its line and say so in a few words.

**Assigned tasks.** When a session starts on a branch with no handoff, and after a `/finish`, read the open tasks assigned to the person, whoever created them: the backlog skill's [listing](../../backlog/SKILL.md#what-to-show), only the group assigned to the user, without postponed tasks. If there are any, name them in a line or two and offer the first with `/start`: "Two things are waiting for you: #42 CSV export and #57 login error. Shall we start with #42?" If the person asked for something else, do that first and put the line at the end of your reply. With none assigned, no task list, or a tracker that is not logged in, say nothing: don't start a login for this.

Once a task is started, `/start` splits it into small steps in the handoff's Next steps, each one doable in a sitting and with a visible result. Offer them one at a time: after each, one line on what is done and the next one as a question.
