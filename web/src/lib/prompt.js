import { readFileSync } from 'fs';
import { join } from 'path';

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

let cached = null;
let cachedAt = 0;

/**
 * Prompt config: the rules block, temperature, max tokens, and model.
 *
 * Default: read PROMPT.md from the repo root. Everything after the first
 * "---" separator line that follows the header is the prompt.
 * Optional: set LANGSMITH_API_KEY and LANGSMITH_PROMPT (hub prompt name) to
 * pull the prompt from LangSmith Hub instead; cached for 5 minutes.
 */
export async function getPromptConfig() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  const config = (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROMPT)
    ? await fetchFromLangSmith()
    : readLocalPrompt();
  cached = config;
  cachedAt = now;
  return config;
}

export function stripPromptHeader(text) {
  // PROMPT.md starts with a short explanatory header ending in a "---" line.
  const idx = text.indexOf('\n---\n');
  return idx === -1 ? text.trim() : text.slice(idx + 5).trim();
}

function readLocalPrompt() {
  const path = process.env.PROMPT_PATH || join(process.cwd(), '..', 'PROMPT.md');
  const raw = readFileSync(path, 'utf8');
  return {
    systemPrompt: stripPromptHeader(raw),
    temperature: Number(process.env.PROMPT_TEMPERATURE ?? 0.1),
    maxTokens: Number(process.env.PROMPT_MAX_TOKENS ?? 2500),
    model: DEFAULT_MODEL,
  };
}

async function fetchFromLangSmith() {
  const { Client } = await import('langsmith');
  const client = new Client({ apiKey: process.env.LANGSMITH_API_KEY });
  const result = await client.pullPromptCommit(process.env.LANGSMITH_PROMPT, { includeModel: true });

  const systemTemplate =
    result.manifest?.kwargs?.first?.kwargs?.messages?.[0]?.kwargs?.prompt?.kwargs?.template;
  if (!systemTemplate) throw new Error('system template not found in manifest');

  const modelConfig = result.hub_model_config ?? {};
  return {
    systemPrompt: systemTemplate,
    temperature: modelConfig.temperature ?? 0.1,
    maxTokens: modelConfig.max_tokens ?? 2500,
    model: modelConfig.model ?? DEFAULT_MODEL,
  };
}
