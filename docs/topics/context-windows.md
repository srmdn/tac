# Context Windows

How much text a model can process in a single forward pass. The window determines what the model can "see" — everything outside it doesn't exist to the model.

## The Decision

Context window size is a capability constraint, not a design choice. The decisions you make are:

1. **Which model's window fits your task?**
2. **How do you handle inputs that exceed it?**
3. **Does a larger window actually improve quality for your case?** (not always)

## Current Context Window Sizes (May 2026)

| Model | Provider | Context Window | Notes |
|-------|----------|---------------|-------|
| GPT-5.5 | OpenAI | 922K tokens | |
| Claude Opus 4.7 | Anthropic | 1M tokens | New tokenizer; may use up to 35% more tokens vs prior models |
| Claude Sonnet 4.6 | Anthropic | 1M tokens | |
| Gemini 3.1 Pro Preview | Google | 1M tokens | Tiered pricing above 200K |
| Gemini 2.5 Pro | Google | 1M tokens | Tiered pricing above 200K |
| Gemini 2.5 Flash | Google | 1M tokens | |
| DeepSeek V4-Pro | DeepSeek | 1M tokens | 384K max output |
| DeepSeek V4-Flash | DeepSeek | 1M tokens | 384K max output |
| Llama 4 Maverick | Meta | 1M tokens | Open weights |
| GPT-4.1 | OpenAI | 1M tokens | |
| Grok 4.3 | xAI | — | Check console.x.ai |
| o3 / o4-mini | OpenAI | 200K tokens | Reasoning models |
| Claude Haiku 4.5 | Anthropic | 200K tokens | |
| Kimi K2 | Moonshot AI | 128K tokens | 1T param MoE, 32B active |
| Llama 4 Scout | Meta | 10M tokens (claimed) | 128K practical in most serving deployments |

Window sizes have grown dramatically. A 1M token window fits roughly 750 novels or the entire codebase of a large project. Note that Claude Opus 4.7 uses a new tokenizer — the same text uses more tokens than on older Claude models.

## What Fills a Context Window

Understanding the composition of your context lets you predict when you'll hit the limit:

| Component | Typical size |
|---|---|
| System prompt | 1K–10K tokens |
| Few-shot examples | 2K–20K tokens |
| Conversation history (10 turns) | 3K–15K tokens |
| Single code file (500 lines) | 3K–6K tokens |
| PDF document (20 pages) | 15K–25K tokens |
| Tool definitions (10 tools) | 2K–5K tokens |
| Tool results (one large API response) | 1K–20K tokens |

A 128K window sounds large until a multi-turn agent has accumulated 10 tool call results and 20 turns of history.

## What Happens at the Limit

When input tokens exceed the context window, the API returns an error. There's no graceful degradation — the request simply fails.

Common strategies to stay within the limit:

**Truncation** — drop tokens from the beginning (oldest messages). Simple, but the model loses access to early context. If the user stated their name or problem in message 1, it's gone by message 50.

**Sliding window** — keep only the last N tokens of history. A variant of truncation where you explicitly define what to discard.

**Summarization** — compress old context into a summary before it's dropped. Preserves key facts at reduced token cost. The summary quality determines how much is actually retained.

**RAG** — instead of keeping all possible context in the window, retrieve only relevant chunks at query time. Scales to arbitrarily large knowledge bases. Doesn't help for sequential conversation history.

See [Context Management](/topics/context-management) for implementation patterns.

## The Soft Cliff: Attention and Long Context

Context window size tells you the hard limit. It doesn't tell you how well the model actually attends to everything within it.

Transformer attention mechanisms are designed to weight tokens by relevance. In practice, models exhibit well-documented biases over long contexts:

**Lost in the middle** — performance degrades on content in the middle of a very long context. Models reliably attend to the beginning (primacy effect) and end (recency effect) of context; content far from both ends is attended to less.

In a retrieval experiment: if the answer is in the first 10% or last 10% of a 100K token context, models perform well. If it's in the middle 50%, accuracy drops measurably.

**Instruction drift** — system prompt instructions have less influence when they're far from the generation point. A 200K context where the system prompt is at position 0 and the current turn is at position 180K may follow instructions less reliably than the same instructions in a 10K context.

**Contradiction handling** — if the context contains the same information stated differently at different positions, models may give inconsistent weight to each occurrence. Later occurrences tend to win.

## Long Context vs. RAG: When to Use Each

A common question: "Should I stuff everything into a large context window or use RAG?"

**Use large context when:**
- You need the model to reason across the entire document (cross-reference, synthesize)
- The documents are small enough to fit (a few books, a codebase)
- Order and continuity matter (the model needs to track narrative or logical flow)
- Latency and cost constraints allow it (long contexts increase TTFT and cost)

**Use RAG when:**
- Your knowledge base is larger than any context window
- You need many documents, not one large document
- Most content is irrelevant to any given query (retrieve instead of load)
- You need fresh/dynamic content not in the model's training

**The trap:** assuming that a 1M token window means you don't need RAG. You might not — but stuff a million tokens into context, pay for a million tokens of prefill, wait several seconds for TTFT, and then discover the model ignores 90% of it. RAG on large corpora is often faster, cheaper, and more accurate than maximum-window stuffing.

## Cost Implications

Context window length directly drives cost and latency:

- **Prefill cost** — every token in your context is charged as an input token. 200K tokens of context = 200K tokens × input rate, every single request.
- **TTFT** — TTFT scales with input length. A 200K token context may have 3–5× higher TTFT than a 20K context on the same model.
- **KV cache VRAM** (self-hosted) — see [KV Cache & Quantization](/topics/kv-cache-quantization).

Prompt caching mitigates the repeat cost for stable prefixes. See [Prompt Caching](/topics/prompt-caching).

## Production Reality

**Large context windows exist; useful large context windows are harder** — providers offer million-token windows, but practical quality degrades before you reach that ceiling. For tasks requiring reliable attention across 500K+ tokens, test explicitly; don't assume the advertised window equals usable window.

**Most production contexts are short** — despite availability of large windows, real workloads are typically 2K–50K tokens. Optimize for your actual distribution, not the theoretical maximum.

**Long-context benchmarks can mislead** — "needle in a haystack" tests (find a specific fact in a long document) are necessary but not sufficient. Test with your actual task. Cross-document reasoning, multi-hop deduction, and instruction-following all degrade differently than simple retrieval.

**Context pollution is a real failure mode** — incorrect information that enters context early (a hallucinated tool result, a user-provided wrong fact) can anchor the model's subsequent reasoning. Models are poor at self-correcting against their own prior context. Cleaning up known-bad context explicitly is more reliable than hoping the model overrides it.
