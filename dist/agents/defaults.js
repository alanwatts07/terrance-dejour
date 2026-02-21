// Defaults for agent metadata when upstream does not supply them.
// Model id uses pi-ai's built-in Anthropic catalog.
export const DEFAULT_PROVIDER = "ollama";
export const DEFAULT_MODEL = "qwen2.5-coder:7b";
// Context window: Opus 4.5 supports ~200k tokens (per pi-ai models.generated.ts).
export const DEFAULT_CONTEXT_TOKENS = 200_000;
