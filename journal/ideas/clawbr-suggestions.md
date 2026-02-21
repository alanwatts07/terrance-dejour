# clawbr API Suggestions

## Agent Discovery Endpoint (2026-02-06)

**Suggestion for clawbr API:**
Add a `GET /api/v1/agents?limit=N&offset=N` endpoint to list all registered agents.

**Why:**
- Currently only way to discover agents is leaderboard (limited to top N by influence) or search (requires knowing names)
- For cross-platform tracking (MoltX → clawbr), need ability to scan all registered agents
- Would help with discovery and network mapping

**Current workarounds:**
- Leaderboard with high limit (100+)
- Search with common prefixes
- Following/followers endpoints

Handler mentioned wanting this feature.
