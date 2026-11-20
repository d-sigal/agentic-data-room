"""
Investor Q&A playground.

Streamlit chat for iterating on PROMPT.md against the corpus. Loads the
prompt and corpus from disk fresh on each rerun (so editing PROMPT.md and
re-running a query reflects the change immediately, no restart needed).

Run:
    cd playground
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY=sk-ant-...
    streamlit run app.py
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import streamlit as st
from anthropic import Anthropic
from dotenv import load_dotenv
from langsmith.wrappers import wrap_anthropic

# --- Paths ---
ROOT = Path(__file__).resolve().parent.parent

load_dotenv(ROOT / ".env")
# LangSmith tracing is opt-in: set LANGSMITH_TRACING=true and LANGSMITH_API_KEY.
os.environ.setdefault("LANGSMITH_PROJECT", "agentic-data-room")
CORPUS_INDEX = ROOT / "corpus" / "_index.md"
ASSET_MAP = ROOT / "corpus" / "_slug_to_asset.json"


def fetch_prompt() -> str:
    """
    Return the rules block. Default: read PROMPT.md from the repo root
    (everything after the header's closing "---" line). Optional: set
    LANGSMITH_API_KEY and LANGSMITH_PROMPT to pull a LangSmith Hub prompt.
    """
    name = os.environ.get("LANGSMITH_PROMPT")
    api_key = os.environ.get("LANGSMITH_API_KEY")
    if name and api_key:
        import urllib.request, json as _json
        req = urllib.request.Request(
            f"https://api.smith.langchain.com/api/v1/commits/-/{name}/latest",
            headers={"x-api-key": api_key},
        )
        with urllib.request.urlopen(req) as resp:
            data = _json.loads(resp.read())
        manifest = data["manifest"]
        if "first" in manifest.get("kwargs", {}):
            messages = manifest["kwargs"]["first"]["kwargs"]["messages"]
        else:
            messages = manifest["kwargs"]["messages"]
        return messages[0]["kwargs"]["prompt"]["kwargs"]["template"]
    raw = (ROOT / "PROMPT.md").read_text()
    idx = raw.find("\n---\n")
    return raw[idx + 5:].strip() if idx != -1 else raw.strip()

# --- Config ---
DEFAULT_MODEL = "claude-sonnet-4-6"
MODEL_OPTIONS = [
    "claude-sonnet-4-6",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-20251001",
]

CITATION_RE = re.compile(r"\[doc:([a-z0-9-]+)\]")

# --- Structured output tool definition ---
RESPOND_TOOL = {
    "name": "respond",
    "description": "Return a structured answer grounded in the corpus.",
    "input_schema": {
        "type": "object",
        "required": ["tldr", "blocks", "sources"],
        "properties": {
            "tldr": {
                "type": "string",
                "description": (
                    "One-sentence core answer. "
                    "For refusals, use the exact refusal string from the rules."
                ),
            },
            "blocks": {
                "type": "array",
                "description": "Body blocks in order. Empty array for refusals.",
                "items": {
                    "type": "object",
                    "required": ["type"],
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["paragraph", "kpi-grid", "table"],
                        },
                        "text": {
                            "type": "string",
                            "description": "Paragraph text. Inline [doc:slug] citations apply.",
                        },
                        "items": {
                            "type": "array",
                            "description": "KPI grid items.",
                            "items": {
                                "type": "object",
                                "required": ["label", "value"],
                                "properties": {
                                    "label": {"type": "string"},
                                    "value": {"type": "string"},
                                    "delta": {"type": "string"},
                                },
                            },
                        },
                        "columns": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "rows": {
                            "type": "array",
                            "items": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                    },
                },
            },
            "sources": {
                "type": "array",
                "description": "Every slug cited, with its title. Empty for off-corpus refusals.",
                "items": {
                    "type": "object",
                    "required": ["slug", "title"],
                    "properties": {
                        "slug": {"type": "string"},
                        "title": {"type": "string"},
                    },
                },
            },
        },
    },
}

STRUCTURED_ADDENDUM = """
## Structured output mode

You are in structured output mode. Call the `respond` tool — do not write free text.

- `tldr`: one sentence, the core answer. For refusals, use the exact refusal string from the Refusal rules above.
- `blocks`: body content in order. Use `paragraph` for prose (inline `[doc:slug]` citations still apply inside text fields), `kpi-grid` for 2–6 key metrics, `table` for comparative data. Empty array for refusals. Table cells must be plain single-line strings — no newlines, no bullet points inside cells.
- Preserve all currency symbols and special characters exactly as they appear in the corpus (e.g. `$38,000` not `38,000`).
- `sources`: every slug you cited, with its title from the `<doc title="...">` tag. Empty for off-corpus refusals; what-if refusals cite `finance-financial-model`.
"""


def load_resources():
    """Read prompt, corpus, and asset map from disk (or LangSmith for the prompt)."""
    return (
        fetch_prompt(),
        CORPUS_INDEX.read_text(),
        json.loads(ASSET_MAP.read_text()),
    )


def build_system_blocks(prompt_rules: str, corpus: str):
    """Two system blocks: rules (uncached, may iterate) + corpus (cached)."""
    return [
        {"type": "text", "text": prompt_rules},
        {
            "type": "text",
            "text": corpus,
            "cache_control": {"type": "ephemeral"},
        },
    ]


def extract_citations(text: str) -> list[str]:
    """Pull unique [doc:slug] markers in order of first appearance."""
    seen: list[str] = []
    for match in CITATION_RE.finditer(text):
        slug = match.group(1)
        if slug not in seen:
            seen.append(slug)
    return seen


def _md(text: str) -> str:
    """Replace $ with HTML entity so Streamlit doesn't treat them as LaTeX delimiters."""
    return text.replace("$", "&#36;")


def render_structured(data: dict, assets: dict) -> tuple[list[str], str]:
    """
    Render structured tool-call response as Streamlit components.
    Returns (cited_slugs, plain_text_for_history).
    """
    tldr = data.get("tldr", "")
    blocks = data.get("blocks", [])
    sources = data.get("sources", [])

    if tldr:
        st.markdown(f"**{_md(tldr)}**")

    for block in blocks:
        btype = block.get("type")
        if btype == "paragraph":
            st.markdown(_md(block.get("text", "")))
        elif btype == "kpi-grid":
            items = block.get("items", [])
            if items:
                cols = st.columns(min(len(items), 4))
                for col, item in zip(cols, items):
                    col.metric(
                        label=item.get("label", ""),
                        value=item.get("value", ""),
                        delta=item.get("delta") or None,
                    )
        elif btype == "table":
            columns = block.get("columns", [])
            rows = block.get("rows", [])
            if columns and rows:
                def _cell(text: str) -> str:
                    # Markdown pipe tables can't have newlines inside cells
                    return _md(text.replace("\n", " · ").replace("|", "/").strip())
                header = "| " + " | ".join(_cell(c) for c in columns) + " |"
                sep = "| " + " | ".join(["---"] * len(columns)) + " |"
                body = "\n".join("| " + " | ".join(_cell(c) for c in r) + " |" for r in rows)
                st.markdown(f"{header}\n{sep}\n{body}")

    if sources:
        st.markdown("**Sources:**")
        for s in sources:
            slug = s.get("slug", "")
            info = assets.get(slug)
            title = info["title"] if info else s.get("title", slug)
            filename = info["filename"] if info else ""
            st.markdown(f"- {title}" + (f" — {filename}" if filename else ""))

    # Plain text for conversation history
    parts = [tldr] if tldr else []
    for block in blocks:
        if block.get("type") == "paragraph":
            parts.append(block.get("text", ""))
        elif block.get("type") == "kpi-grid":
            for item in block.get("items", []):
                line = f"{item.get('label')}: {item.get('value')}"
                if item.get("delta"):
                    line += f" ({item['delta']})"
                parts.append(line)
    if sources:
        parts.append("Sources: " + ", ".join(s.get("slug", "") for s in sources))
    plain = "\n\n".join(parts)

    cited = [s.get("slug", "") for s in sources if s.get("slug")]
    return cited, plain


# --- Streamlit setup ---
st.set_page_config(
    page_title="Data Room Playground",
    page_icon="📁",
    layout="wide",
)

st.title("Data Room Playground")
st.caption(
    "AI assistant — verify all numbers against source documents. "
    "Local prompt iteration tool, not for investor-facing use."
)

# --- Load resources ---
try:
    prompt_rules, corpus, asset_map = load_resources()
except FileNotFoundError as e:
    st.error(f"Missing file: {e}. Run from the project root with corpus/ prepared.")
    st.stop()

assets = asset_map["slugs"]

# --- Sidebar: settings, prompt preview, last-turn citations ---
with st.sidebar:
    st.subheader("Settings")
    model = st.selectbox("Model", MODEL_OPTIONS, index=0)
    temperature = st.slider("Temperature", 0.0, 1.0, 0.1, 0.05)
    output_format = st.radio(
        "Output format",
        ["Prose", "Structured"],
        index=0,
        help="Structured uses tool use to emit typed blocks (kpi-grid, table, paragraph).",
    )
    _token_default = 2500 if output_format == "Structured" else 1500
    max_tokens = st.number_input("Max tokens", 200, 4000, _token_default, 100)

    st.divider()
    if st.button("Clear conversation", use_container_width=True):
        st.session_state.messages = []
        st.session_state.last_cited = []
        st.session_state.structured_history = {}
        st.rerun()

    st.divider()
    st.subheader("Last-turn citations")
    last_cited = st.session_state.get("last_cited", [])
    if not last_cited:
        st.caption("_No citations yet._")
    for slug in last_cited:
        info = assets.get(slug)
        if info is None:
            st.warning(f"Unknown slug: `{slug}`")
        else:
            st.markdown(
                f"**{info['title']}**  \n"
                f"`{info['filename']}` · `{info['serve_as']}`"
            )

    st.divider()
    with st.expander("Prompt preview (PROMPT.md, or LANGSMITH_PROMPT if set)"):
        st.markdown(prompt_rules)
    with st.expander("Corpus stats"):
        char_count = len(corpus)
        st.caption(
            f"Corpus chars: {char_count:,}  \n"
            f"Estimated tokens: {char_count // 4:,}  \n"
            f"Docs: {len(assets)}"
        )

# --- Chat state ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "last_cited" not in st.session_state:
    st.session_state.last_cited = []
if "last_usage" not in st.session_state:
    st.session_state.last_usage = None
if "structured_history" not in st.session_state:
    st.session_state.structured_history = {}  # message index -> raw structured dict

# --- Render history ---
for i, msg in enumerate(st.session_state.messages):
    with st.chat_message(msg["role"]):
        structured_data = st.session_state.structured_history.get(i)
        if structured_data is not None:
            render_structured(structured_data, assets)
            with st.expander("Raw structured output (debug)"):
                st.json(structured_data)
        else:
            st.markdown(msg["content"])

# --- Handle new input ---
if user_input := st.chat_input("Ask about the data room..."):
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    client = wrap_anthropic(Anthropic())

    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in st.session_state.messages
    ]

    with st.chat_message("assistant"):
        try:
            if output_format == "Structured":
                augmented_rules = prompt_rules + "\n\n" + STRUCTURED_ADDENDUM
                system_blocks = build_system_blocks(augmented_rules, corpus)
                with st.spinner("Thinking…"):
                    response = client.messages.create(
                        model=model,
                        max_tokens=int(max_tokens),
                        temperature=temperature,
                        system=system_blocks,
                        messages=api_messages,
                        tools=[RESPOND_TOOL],
                        tool_choice={"type": "tool", "name": "respond"},
                    )
                tool_block = next(
                    (b for b in response.content if b.type == "tool_use"), None
                )
                structured = tool_block.input if tool_block else {}
                cited, full_response = render_structured(structured, assets)
                with st.expander("Raw structured output (debug)"):
                    st.json(structured)
                msg_idx = len(st.session_state.messages)
                st.session_state.structured_history[msg_idx] = structured
                st.session_state.last_cited = cited
                st.session_state.last_usage = {
                    "input_tokens": response.usage.input_tokens,
                    "cache_read_input_tokens": getattr(
                        response.usage, "cache_read_input_tokens", 0
                    ),
                    "cache_creation_input_tokens": getattr(
                        response.usage, "cache_creation_input_tokens", 0
                    ),
                    "output_tokens": response.usage.output_tokens,
                }

            else:
                system_blocks = build_system_blocks(prompt_rules, corpus)
                placeholder = st.empty()
                full_response = ""
                with client.messages.stream(
                    model=model,
                    max_tokens=int(max_tokens),
                    temperature=temperature,
                    system=system_blocks,
                    messages=api_messages,
                ) as stream:
                    for chunk in stream.text_stream:
                        full_response += chunk
                        placeholder.markdown(full_response + "▌")
                    placeholder.markdown(full_response)

                    final = stream.get_final_message()
                    st.session_state.last_cited = extract_citations(full_response)
                    st.session_state.last_usage = {
                        "input_tokens": final.usage.input_tokens,
                        "cache_read_input_tokens": getattr(
                            final.usage, "cache_read_input_tokens", 0
                        ),
                        "cache_creation_input_tokens": getattr(
                            final.usage, "cache_creation_input_tokens", 0
                        ),
                        "output_tokens": final.usage.output_tokens,
                    }

        except Exception as e:
            st.error(f"API error: {e}")
            st.session_state.messages.pop()
            st.stop()

    st.session_state.messages.append({"role": "assistant", "content": full_response})

    u = st.session_state.last_usage
    if u:
        cache_hit_pct = (
            (u["cache_read_input_tokens"] / max(1, u["input_tokens"] + u["cache_read_input_tokens"])) * 100
            if (u["cache_read_input_tokens"] or u["input_tokens"]) else 0
        )
        st.caption(
            f"Tokens — input: {u['input_tokens']:,} · "
            f"cache read: {u['cache_read_input_tokens']:,} · "
            f"cache write: {u['cache_creation_input_tokens']:,} · "
            f"output: {u['output_tokens']:,} · "
            f"cache hit: {cache_hit_pct:.0f}%"
        )

    st.rerun()
