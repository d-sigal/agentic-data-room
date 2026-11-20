import Anthropic from '@anthropic-ai/sdk';
import { wrapSDK } from 'langsmith/wrappers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getPromptConfig } from '@/lib/prompt';
import { getPerson } from '@/lib/allowlist';
import { buildChatCorpus } from '@/lib/access';
import { routeSheets, SHEETS_ADDENDUM } from '@/lib/sheet_router';
import { routeLegalDocs, LEGAL_ADDENDUM } from '@/lib/legal_doc_router';
import { withUser } from '@/lib/identify-server';

const fullCorpus = readFileSync(join(process.cwd(), '..', 'corpus', '_index.md'), 'utf8');

const manifest = (() => {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), '..', 'corpus', '_slug_to_asset.json'), 'utf8'));
  } catch {
    return {};
  }
})();

const RESPOND_TOOL = {
  name: 'respond',
  description: 'Return a structured answer grounded in the corpus.',
  input_schema: {
    type: 'object',
    required: ['tldr', 'blocks', 'sources'],
    properties: {
      tldr: {
        type: 'string',
        description: 'One-sentence core answer. For refusals, use the exact refusal string from the rules.',
      },
      blocks: {
        type: 'array',
        description: 'Body blocks in order. Empty array for refusals.',
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['paragraph', 'kpi-grid', 'table'] },
            text: { type: 'string', description: 'Paragraph text. Inline [doc:slug] citations apply.' },
            items: {
              type: 'array',
              description: 'KPI grid items.',
              items: {
                type: 'object',
                required: ['label', 'value'],
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                  delta: { type: 'string' },
                },
              },
            },
            columns: { type: 'array', items: { type: 'string' } },
            rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
          },
        },
      },
      sources: {
        type: 'array',
        description: 'Every slug cited, with its title. Empty for off-corpus refusals.',
        items: {
          type: 'object',
          required: ['slug', 'title'],
          properties: {
            slug: { type: 'string' },
            title: { type: 'string' },
          },
        },
      },
    },
  },
};

const STRUCTURED_ADDENDUM = `
## Structured output mode

You are in structured output mode. Call the \`respond\` tool — do not write free text.

- \`tldr\`: one sentence, the core answer. For refusals, use the exact refusal string from the Refusal rules above.
- \`blocks\`: body content in order. Use \`paragraph\` for prose (inline \`[doc:slug]\` citations still apply inside text fields), \`kpi-grid\` for 2–6 key metrics, \`table\` for comparative data. Empty array for refusals. Table cells must be plain single-line strings — no newlines, no bullet points inside cells.
- Preserve all currency symbols and special characters exactly as they appear in the corpus (e.g. \`$38,000\` not \`38,000\`).
- \`sources\`: every slug you cited, with its title from the \`<doc title="...">\` tag. Empty for off-corpus refusals; what-if refusals cite \`finance-financial-model\`.
`;

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 20_000;

const client = wrapSDK(new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
}));

export const POST = withUser(async (request) => {
  const { messages } = await request.json();
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES
      || !messages.every(m => m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant')
        && (m.text == null || typeof m.text === 'string') && (m.rawText == null || typeof m.rawText === 'string')
        && (m.text || m.rawText || '').length <= MAX_MESSAGE_CHARS)) {
    return Response.json({ error: 'Invalid messages' }, { status: 400 });
  }
  const { systemPrompt, temperature, maxTokens, model } = await getPromptConfig();

  const userEmail = (request.headers.get('x-user-email') || '').trim().toLowerCase();
  const person = userEmail ? await getPerson(userEmail) : null;
  const corpus = buildChatCorpus(fullCorpus, person?.group ?? 'financial-only');

  const filteredMessages = messages.filter(m => (m.role === 'user' ? m.text : m.rawText));

  // Find the last user message to attach files to it.
  let lastUserIdx = -1;
  for (let i = filteredMessages.length - 1; i >= 0; i--) {
    if (filteredMessages[i].role === 'user') { lastUserIdx = i; break; }
  }
  const lastUserText = lastUserIdx >= 0 ? filteredMessages[lastUserIdx].text : '';

  const group = person?.group ?? 'financial-only';
  const [sheetFileIds, legalFileIds] = await Promise.all([
    routeSheets(lastUserText, manifest),
    group === 'full' ? routeLegalDocs(lastUserText, manifest) : Promise.resolve([]),
  ]);
  const fileIds = [...sheetFileIds, ...legalFileIds];

  const anthropicMessages = filteredMessages.map((m, idx) => {
    const content = m.role === 'user' ? m.text : m.rawText;
    if (idx === lastUserIdx && fileIds.length > 0) {
      return {
        role: m.role,
        content: [
          ...fileIds.map(fid => ({ type: 'document', source: { type: 'file', file_id: fid } })),
          { type: 'text', text: content },
        ],
      };
    }
    return { role: m.role, content };
  });

  // Build reverse map so we can tell the model which slug each attached legal doc has.
  const fileIdToLegal = Object.fromEntries(
    Object.entries(manifest?.legal_docs ?? {})
      .filter(([, info]) => info?.claude_file_id)
      .map(([slug, info]) => [info.claude_file_id, { slug, title: info.title }])
  );
  const attachedLegalMeta = legalFileIds.map(fid => fileIdToLegal[fid]).filter(Boolean);

  const addenda = [STRUCTURED_ADDENDUM];
  if (sheetFileIds.length) addenda.push(SHEETS_ADDENDUM);
  if (attachedLegalMeta.length) {
    const slugLines = attachedLegalMeta
      .map(d => `- [doc:${d.slug}] — ${d.title}`)
      .join('\n');
    addenda.push(LEGAL_ADDENDUM + `\n\nAttached documents and their citation slugs:\n${slugLines}`);
  }
  const systemRules = systemPrompt + '\n\n' + addenda.join('\n\n');

  const response = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      temperature,
      system: [
        { type: 'text', text: systemRules },
        { type: 'text', text: corpus, cache_control: { type: 'ephemeral' } },
      ],
      tools: [RESPOND_TOOL],
      tool_choice: { type: 'tool', name: 'respond' },
      messages: anthropicMessages,
    },
    fileIds.length ? { headers: { 'anthropic-beta': 'files-api-2025-04-14' } } : {},
  );

  const toolBlock = response.content.find(b => b.type === 'tool_use');
  if (!toolBlock) return Response.json({ error: 'no tool response' }, { status: 500 });

  return Response.json(toolBlock.input);
});
