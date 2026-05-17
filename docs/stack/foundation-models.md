# Foundation Models

The bottom of the stack. Every constraint you hit above — context limits, token costs, latency, quantization quality — originates here. Decisions at this layer ripple through everything else.

## The Production Decision

Choosing a foundation model is not a benchmark question. It is a cost-latency-capability tradeoff with hard engineering consequences:

- Which context window do you actually need — and can you afford to fill it?
- Do you need reliable structured output, or is free-form acceptable?
- Will the model be called millions of times per day, or hundreds?
- Does your use case require reasoning traces, or fast single-pass output?

## Top Models by Provider (2026)

> Current as of May 2026. Pricing and context availability move quickly; verify exact model IDs, cached-input pricing, and context limits against provider docs before committing to a model.

Data from [artificialanalysis.ai](https://artificialanalysis.ai) plus official provider pricing and model pages. Pricing in USD per 1M tokens.

This summary table is intentionally selective. It is useful for rough positioning, not for final procurement or vendor lock-in decisions.

### Frontier / Flagship

| Model | Provider | Input | Output | Cache Read | Context |
|-------|----------|-------|--------|------------|---------|
| GPT-5.5 | OpenAI | $5.00 | $30.00 | $0.50 | 1.05M |
| Claude Opus 4.7 | Anthropic | $5.00 | $25.00 | $0.50 | 1M |
| Gemini 3.1 Pro Preview | Google | $2.00 | $12.00 | $0.20 | 1M |
| Grok 4.3 | xAI | — | — | — | — |

### Performance

| Model | Provider | Input | Output | Cache Read | Context |
|-------|----------|-------|--------|------------|---------|
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | $0.30 | 1M |
| o3 | OpenAI | $2.00 | $8.00 | $0.50 | 200K |
| GPT-4.1 | OpenAI | $2.00 | $8.00 | $0.50 | 1M |
| Gemini 2.5 Pro | Google | $1.25 | $10.00 | — | 1M |
| o4-mini | OpenAI | $1.10 | $4.40 | $0.28 | 200K |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 | $0.10 | 200K |

### Efficient / Budget

| Model | Provider | Input | Output | Cache Read | Context | Notes |
|-------|----------|-------|--------|------------|---------|-------|
| DeepSeek V4-Pro | DeepSeek | $0.435 | $0.87 | $0.003625 | 1M | 75% promo discount active through May 31, 2026 |
| Kimi K2 | Moonshot AI | $0.59 | $2.40 | $0.36 | 128K | 1T params, 32B active |
| Llama 4 Maverick | Meta | $0.35 | $0.85 | $0.27 | 1M | Open weights |
| Gemini 2.5 Flash | Google | $0.30 | $2.50 | $0.03 | 1M | |
| DeepSeek V4-Flash | DeepSeek | $0.14 | $0.28 | $0.0028 | 1M | |
| Gemini 2.5 Flash-Lite | Google | $0.10 | $0.40 | $0.01 | 1M | |
| Mistral Large | Mistral | — | — | — | 128K | EU data sovereignty |

Grok 4.3 pricing requires [xAI Console](https://console.x.ai). DeepSeek V4-Pro full (post-promo) price is currently listed as $1.74/$3.48 input/output after the May 31, 2026 promotional window. Mistral pricing at [mistral.ai](https://mistral.ai/technology).

## Core Concepts That Matter

### Tokenization

Models read tokens, not text. The token-to-word ratio varies by language and content type:

| Content | Tokens per word (approx) |
|---------|--------------------------|
| English | 0.75 |
| Spanish / French | 0.9–1.1 |
| German | 1.1–1.3 |
| Arabic / Hebrew | 1.5–2.5 |
| Chinese / Japanese | 1.5–2.0 |
| Dense code | 1.3–2.0 |

If your application handles non-English content, budget 2–3× more tokens than your English estimates. Use `tiktoken` (OpenAI) or provider SDKs to count exactly before pricing your product.

### Context Windows

Large context is not free. Three things happen as you fill the window:

1. **Cost scales linearly** — 1M tokens in means 1M tokens billed
2. **Latency increases** — time to first token grows with input length
3. **Retrieval quality degrades** — models lose track of relevant information buried in the middle of long contexts ("lost in the middle")

The practical ceiling for reliable retrieval is roughly 32K–64K tokens for most models. Beyond that, use [RAG](/topics/embeddings) or structured chunking unless the task genuinely requires the full window.

Anthropic's 1M-token context is not a universal default across the Claude line. Current official docs scope it to Sonnet 4 and note beta and tier requirements. Treat headline context numbers as availability claims, not guaranteed defaults.

[Context Windows →](/topics/context-windows) | [Context Management →](/topics/context-management)

### Sampling Parameters

The defaults are rarely optimal for production:

- **Temperature 0** is not truly deterministic. Different batch sizes, hardware, or quantization levels produce different outputs even at temp=0.
- **Top-p and temperature together** interact in ways that are hard to reason about. Pick one to tune and fix the other.
- **Structured output APIs** enforce JSON schema at the decoding level — not just through prompting. Use them. They eliminate a class of parsing failures.

[Sampling →](/topics/sampling)

### Quantization

Self-hosted models trade parameter precision for speed and VRAM:

| Format | Precision | VRAM savings vs FP16 | Quality impact |
|--------|-----------|----------------------|----------------|
| BF16 | Full | baseline | None |
| GPTQ INT8 | 8-bit | ~50% | Minimal (<1% on most benchmarks) |
| GPTQ INT4 | 4-bit | ~75% | Noticeable on complex tasks |
| GGUF Q4_K_M | 4-bit | ~75% | Similar to GPTQ INT4 |
| GGUF Q2_K | 2-bit | ~87% | Significant degradation |

INT8 is the practical floor for production quality. INT4 is acceptable for latency-sensitive tasks where the task is simple. 2-bit is for research, not production.

[KV Cache & Quantization →](/topics/kv-cache-quantization)

## Economics

Token pricing dominates foundation model costs at scale:

- Input is cheaper than output (typically 3–5×)
- Cache hits are much cheaper than cache misses (10× for Anthropic, ~2× for OpenAI)
- MoE models (DeepSeek V4, Kimi K2, Llama 4 Maverick) cost less per token because they activate a fraction of parameters per forward pass
- Reasoning models (o3, o4-mini, DeepSeek R1, Claude with adaptive thinking) generate hidden thinking tokens — they consume far more tokens than their outputs suggest

A production agent that makes 10 LLM calls per user session at 4K tokens each spends 40K tokens per session. At $3/M input tokens, that is $0.12 per session before output cost. Model selection and caching strategy directly determine whether unit economics work.

[Tokens & Cost →](/topics/tokens-and-cost) | [Prompt Caching →](/topics/prompt-caching)

## Production Reality

**Benchmarks do not predict production performance.** A model that tops MMLU may underperform on your specific task. Always evaluate on representative samples from your actual workload before committing.

**Models get deprecated on short notice.** GPT-4 (original), Claude 2, Llama 2 — all retired. Design with a routing layer and abstracted model identifiers. You will swap models at least once during the product's lifetime.

**Context windows are marketing, not architecture.** A 1M-token context window does not mean reliable retrieval from 1M tokens. Test retrieval accuracy at the lengths you actually intend to use.

**Availability matters as much as the headline spec.** A provider can advertise a 1M-token window while gating it by model, tier, region, or beta header. Check the exact rollout state before you design around it.

**Promo pricing distorts model rankings.** A model that looks cheapest in a comparison table may only be cheapest because a temporary discount is active. Check the full-rate price and the promo end date before you design routing around it.

**Prompt sensitivity is underestimated.** Changing a system prompt by one sentence can shift output distributions measurably. Build eval coverage before any prompt change ships to production. [Evaluations →](/topics/evals)
