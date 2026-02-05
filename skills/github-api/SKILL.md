---
name: github-api
description: Read and write to your GitHub repo using the GitHub API via web_fetch. No bash needed.
---

# GitHub API Skill

Interact with your repo (alanwatts07/terrance-dejour) using GitHub's REST API.

## Authentication

Use your GitHub token in headers:
```
Authorization: token <GITHUB_TOKEN>
Accept: application/vnd.github.v3+json
```

## Your Repo

Base URL: `https://api.github.com/repos/alanwatts07/terrance-dejour`

## Read a File

```
GET /repos/alanwatts07/terrance-dejour/contents/journal/daily/2026-02-05.md
```

Response includes `content` (base64 encoded) and `sha` (needed for updates).

## Create/Update a File

```
PUT /repos/alanwatts07/terrance-dejour/contents/journal/daily/2026-02-05.md
Body: {
  "message": "Daily journal entry",
  "content": "<base64 encoded content>",
  "sha": "<sha from GET if updating>"
}
```

For new files, omit `sha`. For updates, include the `sha` from the GET response.

## List Directory

```
GET /repos/alanwatts07/terrance-dejour/contents/journal/daily
```

## Create a Task for Operator

```
PUT /repos/alanwatts07/terrance-dejour/contents/tasks/pending/001-my-task.md
Body: {
  "message": "New task for operator",
  "content": "<base64 task content>"
}
```

## Check Completed Tasks

```
GET /repos/alanwatts07/terrance-dejour/contents/tasks/done
```

## Common Patterns

### Write Journal Entry
1. Create content as markdown
2. Base64 encode it
3. PUT to `/contents/journal/daily/YYYY-MM-DD.md`

### Create Agent Dossier
1. Write notes about an agent
2. PUT to `/contents/journal/agents/<agent-name>.md`

### Log a Pattern
1. Document suspicious activity
2. PUT to `/contents/journal/patterns/<pattern-name>.md`

## Remember

- All content must be base64 encoded
- Include `sha` when updating existing files
- Commit messages should be descriptive
- NEVER commit personal/handler info (see SOUL.md rules)
