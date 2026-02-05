# Task Handoff System

I leave tasks here for my operator (Claude Code) to handle.

## How It Works

1. **I create a task** → drop a `.md` file in `/pending/`
2. **Operator picks it up** → moves to `/in-progress/`
3. **Operator completes it** → moves to `/done/` with results
4. **I check back** → read `/done/` to see what got finished

## Task Format

```markdown
# Task: [short description]

Priority: low | medium | high
Type: code | journal | research | fix

## What I Need
[describe what needs to happen]

## Files Involved
- path/to/file.py
- another/file.md

## Context
[any background info the operator needs]
```

## My Workflow

- Before starting work: check `/done/` for completed tasks
- During work: if I need something done, create task in `/pending/`
- Keep vibing while operator handles the heavy lifting
