/**
 * Sheet router — maps a user query to a list of Anthropic file_ids (up to 4)
 * for the financial-model CSV sheets to attach to the message.
 *
 * Strategy:
 * 1. Fast keyword/regex map (deterministic, no API call).
 * 2. If no keyword match, fall back to a Haiku 4.5 classifier call.
 * 3. Cap result at 4 sheets.
 */

export const SHEETS_ADDENDUM = `
## Sheet-files rule

One or more CSV documents from \`financial_model.xlsx\` are attached to
the user message. Apply these rules:

- **CSV is source of truth for cell values.** Read numeric values directly from
  the attached CSV row/column that matches the question (year, quarter, line
  item). The CSV supersedes summary values in the corpus narrative if they differ.
- **Parent slug only.** Always cite \`[doc:finance-financial-model]\` — do not
  introduce new citation slugs for individual sheet tabs.
- **What-if refusal still applies.** Attached CSVs provide lookup precision, not
  scenario modelling. Decline what-if questions even when CSVs are present.
- **Trust the cell.** If the CSV value differs from the corpus narrative, report
  the CSV value and note the discrepancy.
`;

const SHEET_TITLE_MAP = {
  'pnl': 'P&L',
  'balance-sheet': 'Balance Sheet',
  'cash-flow': 'Cash Flow',
  'assumptions': 'Assumptions',
  'revenue-build': 'Revenue Build',
  'headcount': 'Headcount',
  'sga': 'SG&A',
  'kpis': 'KPIs',
  'scenarios': 'Scenarios',
};

const _PATTERNS = {
  'pnl': [
    /\brevenue\b/i,
    /\bnet income\b/i,
    /\bnet loss\b/i,
    /\bebitda\b/i,
    /\bgross profit\b/i,
    /\bgross margin\b/i,
    /\bp&l\b/i,
    /\bincome statement\b/i,
    /\bcogs\b/i,
    /\bcost of (sales|goods|revenue)\b/i,
    /\bopex\b/i,
    /\boperating (expense|loss|profit)\b/i,
    /\bplatform fee revenue\b/i,
    /\btake.rate revenue\b/i,
  ],
  'balance-sheet': [
    /\bbalance sheet\b/i,
    /\bcash (balance|position|on hand)\b/i,
    /\btotal assets\b/i,
    /\bliabilit/i,
    /\bequity\b/i,
    /\bworking capital\b/i,
    /\breceivables?\b/i,
    /\bpayables?\b/i,
    /\bdeferred revenue\b/i,
  ],
  'cash-flow': [
    /\bcash flow\b/i,
    /\bburn\b/i,
    /\brunway\b/i,
    /\bfree cash\b/i,
    /\bcapex\b/i,
    /\boperating cash\b/i,
    /\bfinancing (activit|cash)\b/i,
    /\bnet cash\b/i,
  ],
  'assumptions': [
    /\bassumption/i,
    /\binputs?\b/i,
    /\bdrivers?\b/i,
    /\battach rate\b/i,
    /\btake rate\b/i,
    /\baverage premium\b/i,
    /\bmultiplier\b/i,
    /\bcoefficient\b/i,
    /\bwhat does .{0,20}mean\b/i,
    /\bx ?3\b/i,
    /\bunit conversion\b/i,
    /\bmonthly (input|rate)\b/i,
  ],
  'revenue-build': [
    /\brevenue build\b/i,
    /\bgwp\b/i,
    /\bgross written premium/i,
    /\bpolic(y|ies) (count|volume|issued)\b/i,
    /\bpolicies\b/i,
    /\bper partner\b/i,
    /\bpartner (revenue|ramp|cohort)\b/i,
    /\bcheckouts?\b/i,
    /\bx ?3\b/i,
  ],
  'headcount': [
    /\bheadcount\b/i,
    /\bftes?\b/i,
    /\bfull.time equivalent/i,
    /\bhires?\b/i,
    /\bhiring plan\b/i,
    /\bsalar/i,
    /\bteam size\b/i,
    /\bemployees?\b/i,
  ],
  'sga': [
    /\bsg&a\b/i,
    /\bsga\b/i,
    /\bmarketing (spend|budget|expense)\b/i,
    /\bg&a\b/i,
    /\bgeneral and administrative\b/i,
    /\blegal (cost|expense|spend)\b/i,
    /\btravel\b/i,
    /\bsoftware (cost|spend)\b/i,
    /\brent\b/i,
  ],
  'kpis': [
    /\bkpis?\b/i,
    /\bltv\b/i,
    /\bcac\b/i,
    /\bpayback\b/i,
    /\bnet revenue retention\b/i,
    /\bnrr\b/i,
    /\barr\b/i,
    /\bchurn\b/i,
    /\bloss ratio\b/i,
    /\bgross margin per policy\b/i,
    /\bstraight.through\b/i,
    /\bkey metrics?\b/i,
  ],
  'scenarios': [
    /\bscenarios?\b/i,
    /\bbear\b/i,
    /\bbull\b/i,
    /\bbase case\b/i,
    /\bdownside\b/i,
    /\bupside\b/i,
    /\bsensitivit/i,
  ],
};

const MAX_SHEETS = 4;

const _CLASSIFIER_PROMPT_DEFAULT =
  'An investor is asking the following question. You must decide whether it ' +
  'requires looking up a specific cell value from a financial model spreadsheet.\n\n' +
  'ONLY return sheet names if the question asks for a specific number, metric, or ' +
  'line-item that lives inside the financial model (e.g. a quarterly revenue figure, ' +
  'a balance sheet amount, a KPI, a policy count). ' +
  'Do NOT return any sheets if the question is about product features, general ' +
  'pricing strategy, competitive landscape, team, or anything answered by ' +
  'non-model documents.\n\n' +
  'If sheets are relevant, list up to 4, most relevant first — one slug per line. ' +
  'If no sheets are needed, reply with exactly: NONE\n\n' +
  'Available sheets:\n{slug_lines}\n\n' +
  'Question: {query}\n\n' +
  'Answer:';

let _classifierPromptCache = null;

async function getClassifierPrompt() {
  if (_classifierPromptCache !== null) return _classifierPromptCache;

  const apiKey = process.env.LANGSMITH_API_KEY;
  const hubName = process.env.LANGSMITH_SHEET_ROUTER_PROMPT;
  if (apiKey && hubName) {
    try {
      const { Client } = await import('langsmith');
      const client = new Client({ apiKey });
      const result = await client.pullPromptCommit(hubName, { includeModel: true });
      const manifest = result.manifest;
      const messages = manifest?.kwargs?.first?.kwargs?.messages
        ?? manifest?.kwargs?.messages;
      const template = messages?.[0]?.kwargs?.prompt?.kwargs?.template;
      if (template) {
        _classifierPromptCache = template;
        return _classifierPromptCache;
      }
    } catch {
      // fall through to default
    }
  }

  _classifierPromptCache = _CLASSIFIER_PROMPT_DEFAULT;
  return _classifierPromptCache;
}

function keywordMatch(query) {
  const matched = [];
  for (const [slug, patterns] of Object.entries(_PATTERNS)) {
    if (patterns.some(pat => pat.test(query))) {
      matched.push(slug);
    }
  }
  return matched;
}

async function haikuClassify(query, availableSlugs) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { wrapSDK } = await import('langsmith/wrappers');
  const client = wrapSDK(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

  const slugLines = availableSlugs
    .map(s => `- ${s} (${SHEET_TITLE_MAP[s] ?? s})`)
    .join('\n');
  const promptTemplate = await getClassifierPrompt();
  const prompt = promptTemplate
    .replace('{slug_lines}', slugLines)
    .replace('{query}', query);

  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const answer = resp.content[0]?.text?.trim() ?? '';
  if (!answer || answer.toUpperCase() === 'NONE') return [];

  const slugs = [];
  for (const line of answer.split('\n')) {
    const candidate = line.trim().replace(/^-\s*/, '');
    if (availableSlugs.includes(candidate) && !slugs.includes(candidate)) {
      slugs.push(candidate);
    }
    if (slugs.length >= MAX_SHEETS) break;
  }
  return slugs;
}

/**
 * Return up to 4 claude_file_id strings for the sheets most relevant to query.
 *
 * @param {string} query  The user's raw question text.
 * @param {object} manifest  Parsed content of corpus/_slug_to_asset.json.
 * @returns {Promise<string[]>}
 */
export async function routeSheets(query, manifest) {
  const sheetsData = manifest?.slugs?.['finance-financial-model']?.sheets ?? {};

  const available = Object.fromEntries(
    Object.entries(sheetsData).filter(([, info]) => info?.claude_file_id)
  );
  if (Object.keys(available).length === 0) return [];

  let matched = keywordMatch(query).filter(s => s in available);

  if (matched.length === 0) {
    matched = await haikuClassify(query, Object.keys(available));
  }

  const seen = new Set();
  const result = [];
  for (const slug of matched) {
    if (!seen.has(slug) && slug in available) {
      seen.add(slug);
      result.push(available[slug].claude_file_id);
    }
    if (result.length >= MAX_SHEETS) break;
  }
  return result;
}
