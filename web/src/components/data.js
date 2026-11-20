// Sample source descriptors used by the source drawer for mock/demo sources.
// Real citations resolve through corpus/_slug_to_asset.json, not this list.
export const SOURCES = [
  { id: 1, doc: 'Series B Pitch Deck.pdf',   page: 4,          kind: 'deck',  excerpt: 'Net revenue of $41.6M in 2025 on $212.0M of gross written premium across 14 distribution partners.' },
  { id: 2, doc: 'financial_model.xlsx',      page: 'KPIs!C9',  kind: 'sheet', excerpt: 'Net revenue retention 131% as of Q3 2026; CAC payback 7.2 months.' },
  { id: 3, doc: 'Product Overview.pdf',      page: 2,          kind: 'doc',   excerpt: 'Growth plan: $4,000 per month platform fee plus an 18% take rate on gross written premium.' },
];

export const SRC = Object.fromEntries(SOURCES.map(s => [s.id, s]));

export const SUGGESTED_QUESTIONS = {
  full: [
    { tag: 'Product',     q: 'What does the product do, and what does the Growth plan cost?' },
    { tag: 'Revenue',     q: 'What is projected net revenue and gross margin in 2028?' },
    { tag: 'Unit econ',   q: 'What are CAC payback and net revenue retention?' },
    { tag: 'Partners',    q: 'How many distribution partners are signed, and which are live?' },
    { tag: 'Competitive', q: 'Who are the main competitors?' },
    { tag: 'Risks',       q: 'What are the biggest concentration risks?' },
  ],
  'financial-only': [
    { tag: 'Revenue',   q: 'What is projected net revenue and gross margin in 2028?' },
    { tag: 'Unit econ', q: 'What are CAC payback and net revenue retention?' },
  ],
};
