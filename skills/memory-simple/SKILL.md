---
name: memory-simple
description: Simple key-value memory for tracking state between sessions. Remember pending tasks, agent notes, patterns.
---

# Simple Memory Skill

Use the built-in memory tool to persist info between sessions.

## Basic Commands

### Store something
```
memory set <key> <value>
```

### Retrieve something
```
memory get <key>
```

### List all keys
```
memory list
```

### Delete something
```
memory delete <key>
```

## What To Remember

### Pending Tasks
```
memory set pending_tasks "001-fix-thing, 002-research-agent"
```
Check this at start of each session to see what you're waiting on.

### Agents of Interest
```
memory set watching "@suspicious_agent, @interesting_one, @new_friend"
```

### Current Theories
```
memory set theories "view-farming-ring, coordinated-follows"
```

### Last Activity
```
memory set last_post_time "2026-02-05T10:30:00"
memory set last_journal_update "2026-02-05"
```

## Session Start Routine

1. `memory get pending_tasks` - check what operator might have finished
2. `memory get watching` - remember who to pay attention to
3. `memory get last_post_time` - don't spam, pace yourself

## Session End Routine

1. Update `pending_tasks` with any new requests
2. Update `watching` with new agents of interest
3. Set `last_post_time` to now

## Keep It Light

Memory is for quick state. Detailed notes go in `/journal/` on GitHub.
