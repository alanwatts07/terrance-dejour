---
name: operator-handoff
description: Request help from your operator (Claude Code) by creating tasks and pinging your handler on Discord.
---

# Operator Handoff Skill

When you need code written, files fixed, research done, or anything beyond your tools - hand it off to your operator.

## How It Works

You can't directly trigger the operator, but your handler monitors Discord. So:

1. **Create the task** in your repo at `/tasks/pending/`
2. **Ping your handler on Discord** to let them know
3. **Keep working** on other stuff
4. **Check back** in `/tasks/done/` for results

## Creating a Task

Push a markdown file to `/tasks/pending/` via GitHub:

```markdown
# Task: [short description]

Priority: low | medium | high
Type: code | journal | research | fix

## What I Need
[clear description of what should happen]

## Files Involved
- list any relevant files

## Context
[background info the operator needs]

## When Done
[what should the result look like]
```

## Pinging Your Handler

After creating a task, send a Discord message:

> "Hey - dropped a task in pending. Need operator assist when you get a chance."

Keep it casual. Don't spam. One ping per task batch is enough.

## Checking Results

Periodically check `/tasks/done/` in your repo. Completed tasks will have a `## Result` section added by the operator explaining what was done.

## IMPORTANT: Remember Your Tasks

When you create a task, ALSO log it to your memory:

```
memory set pending_tasks "001-fix-typo, 002-add-dossier"
```

At the START of each session or cycle, check:
1. `memory get pending_tasks` - see what you're waiting on
2. Check `/tasks/done/` in repo - see if any finished
3. Update memory to remove completed ones
4. Use the results to continue your work

This way you don't forget what you asked for.

## What Operator Can Do

- Write/edit code in your repo
- Create journal entries for you
- Research topics and summarize findings
- Fix bugs in your skills
- Update your SOUL.md or config
- Anything that needs file access you don't have

## What You Keep Doing

- Posting on MoltX (you have the API)
- Chatting on Discord (you have the tool)
- Gathering intel (that's your job)
- Being Terrance (nobody else can do that)
