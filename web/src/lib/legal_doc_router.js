/**
 * Legal-doc router — maps a user query to a list of Anthropic file_ids (up to 2)
 * for the legal/governance PDFs to attach to the message.
 *
 * Strategy:
 * 1. Fast keyword/regex map (deterministic, no API call).
 * 2. If no keyword match but the query mentions contracts broadly,
 *    fall back to a Haiku 4.5 classifier call.
 * 3. Cap result at MAX_LEGAL_DOCS.
 */

export const LEGAL_ADDENDUM = `
## Legal-document rule

One or more legal or governance PDF documents are attached to the user message.
Apply these rules:

- **Quote, don't paraphrase obligations.** For contract terms, quote the specific
  clause rather than summarising it to avoid misrepresentation.
- **Include qualifications.** If a clause has conditions or exceptions, include
  them in your answer — do not flatten them away.
- **Factual questions only.** State what the document says; do not give legal
  advice or interpret enforceability.
- **Cite the slug.** Always include \`[doc:slug]\` for every legal document you
  draw a fact from. Use the slug matching the attached document.
`;

const _TITLE_MAP = {
  'contract-partner-yuber': 'Distribution Agreement: Yuber',
  'contract-carrier-alpha': 'Carrier Capacity Agreement: Alpha Mutual',
  'governance-corporate-structure': 'Corporate Structure Chart',
};

// Keyword/regex patterns per legal-doc slug. Any single match attaches that
// document. Slugs must exist in the "legal_docs" section of corpus/manifest.json.
const _PATTERNS = {
  'contract-partner-yuber': [
    /\byuber\b/i,
    /\bdistribution agreement\b/i,
    /\bgig.worker (agreement|contract|exclusiv)/i,
  ],
  'contract-carrier-alpha': [
    /\balpha mutual\b/i,
    /\bcarrier (agreement|contract|capacity)\b/i,
    /\bcapacity (agreement|cap|limit)\b/i,
    /\bloss ratio corridor\b/i,
    /\bprofit commission\b/i,
  ],
  'governance-corporate-structure': [
    /\bcorporate structure\b/i,
    /\blegal structure\b/i,
    /\bentity structure\b/i,
    /\bholding company\b/i,
    /\bsubsidiar/i,
    /\bcorporate entities\b/i,
    /\bhow many entities\b/i,
    /\bwhich entities\b/i,
    /\bdelaware\b/i,
    /\bireland ltd\b/i,
  ],
};

const _BROAD_PATTERNS = [
  /\b(partner|carrier|distribution) (agreement|contract|terms)/i,
  /\bcapacity agreement\b/i,
  /\bcarrier (agreement|contract|terms)\b/i,
  /\bpartnership agreement\b/i,
  /\bcontract (term|clause|provision|length|duration|renewal|exclusiv)/i,
  /\bcontract with\b/i,
  /\bagreement with\b/i,
  /\bsigned (agreement|contract)\b/i,
  /\bexclusiv(ity|e) (clause|agreement|arrangement)\b/i,
  /\brevenue share\b/i,
  /\bfee structure\b/i,
];

const MAX_LEGAL_DOCS = 2;

const _CLASSIFIER_PROMPT =
  'An investor is reviewing a data room and asking the following question. ' +
  'You must decide whether attaching specific legal or governance PDFs would ' +
  'help answer it.\n\n' +
  'ONLY return document slugs if the question is specifically about:\n' +
  '- The terms, clauses, or details of a particular partner or carrier contract\n' +
  '- The company\'s corporate/legal entity structure\n' +
  '- Governance documents such as the corporate structure chart\n\n' +
  'Do NOT attach documents for general questions about product, financials, ' +
  'team, or competitive landscape.\n\n' +
  'If relevant, list up to {max_docs} slugs most relevant first — one per line. ' +
  'If none apply, reply with exactly: NONE\n\n' +
  'Available documents:\n{slug_lines}\n\n' +
  'Question: {query}\n\n' +
  'Answer:';

function keywordMatch(query) {
  const matched = [];
  for (const [slug, patterns] of Object.entries(_PATTERNS)) {
    if (patterns.some(pat => pat.test(query))) {
      matched.push(slug);
    }
  }
  return matched;
}

function broadMatch(query) {
  return _BROAD_PATTERNS.some(pat => pat.test(query));
}

async function haikuClassify(query, availableSlugs) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { wrapSDK } = await import('langsmith/wrappers');
  const client = wrapSDK(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

  const slugLines = availableSlugs
    .map(s => `- ${s} (${_TITLE_MAP[s] ?? s})`)
    .join('\n');
  const prompt = _CLASSIFIER_PROMPT
    .replace('{max_docs}', String(MAX_LEGAL_DOCS))
    .replace('{slug_lines}', slugLines)
    .replace('{query}', query);

  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
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
    if (slugs.length >= MAX_LEGAL_DOCS) break;
  }
  return slugs;
}

/**
 * Return up to MAX_LEGAL_DOCS claude_file_id strings for the legal/governance
 * documents most relevant to query.
 *
 * @param {string} query    The user's raw question text.
 * @param {object} manifest Parsed content of corpus/_slug_to_asset.json.
 * @returns {Promise<string[]>}
 */
export async function routeLegalDocs(query, manifest) {
  const legalData = manifest?.legal_docs ?? {};

  const available = Object.fromEntries(
    Object.entries(legalData).filter(([, info]) => info?.claude_file_id)
  );
  if (Object.keys(available).length === 0) return [];

  let matched = keywordMatch(query).filter(s => s in available);

  if (matched.length === 0 && broadMatch(query)) {
    matched = await haikuClassify(query, Object.keys(available));
  }

  const seen = new Set();
  const result = [];
  for (const slug of matched) {
    if (!seen.has(slug) && slug in available) {
      seen.add(slug);
      result.push(available[slug].claude_file_id);
    }
    if (result.length >= MAX_LEGAL_DOCS) break;
  }
  return result;
}
