# Tokens & Cost

The fundamental unit of LLM economics. Every design decision — model choice, prompt length, output verbosity, caching strategy — is a cost decision.

## What Is a Token?

A token is the smallest unit a model processes. In English, one token is roughly 4 characters or 0.75 words. The tokenizer converts your text into a sequence of integer IDs before the model ever sees it.

```
"The quick brown fox" → [464, 2068, 7586, 21831] → 4 tokens
```

Tokens are not words. Word boundaries, punctuation, and capitalization all affect how text tokenizes. The same word tokenizes differently depending on whether it appears at the start of a sentence, mid-sentence, or in code.

### Non-English Languages Cost More

Tokenizers are trained predominantly on English text. Non-English text tokenizes at worse ratios, which directly inflates cost:

| Language | Tokens per word (approx) | vs. English |
|----------|-------------------------|-------------|
| English | ~1.3 | baseline |
| Spanish / French / German | ~1.4–1.6 | 1.1–1.2x |
| Indonesian / Malay | ~1.5–2.0 | 1.2–1.5x |
| Russian | ~2.0–3.0 | 1.5–2.3x |
| Arabic | ~3.0–4.0 | 2.3–3.1x |
| Chinese | ~1.5–2.0 per character | 2–4x by byte |
| Japanese | ~2.0–3.0 per character | 2–4x by byte |
| Hebrew | ~4.0–5.0 | up to 4x |

If you're building for non-English users, account for this in your cost estimates. A system prompt that's 2K tokens in English can be 6K+ tokens in Arabic, or 3–4K in Indonesian due to agglutinative affixing.

### Token Counts for Common Content

| Content type | Approximate tokens |
|---|---|
| Short chat message (1–2 sentences) | 20–80 |
| Typical paragraph (~100 words) | 150–200 |
| Standard page (~750 words) | ~1,000 |
| Python function (~50 lines) | 400–800 |
| Code file (~1,000 lines) | 10,000+ |
| PDF research paper (~8 pages) | 8,000–15,000 |
| Support conversation (5–7 turns) | 2,000–5,000 cumulative |

## Current Pricing (May 2026)

Input and output tokens are priced separately. Output tokens cost 3–5× more than input tokens on most models — generating verbose responses is significantly more expensive than reading long prompts.

Source: [artificialanalysis.ai](https://artificialanalysis.ai) + official provider pricing pages.

### Flagship Models

| Model | Provider | Input /1M | Output /1M | Cache Read /1M | Context |
|-------|----------|-----------|------------|---------------|---------|
| GPT-5.5 | OpenAI | $5.00 | $30.00 | $0.50 | 922K |
| Claude Opus 4.7 (`claude-opus-4-7`) | Anthropic | $5.00 | $25.00 | $0.50 | 1M |
| Gemini 3.1 Pro Preview | Google | $2.00 | $12.00 | $0.20 | 1M |
| Grok 4.3 | xAI | — | — | — | — |

### Performance Tier

| Model | Provider | Input /1M | Output /1M | Cache Read /1M | Context |
|-------|----------|-----------|------------|---------------|---------|
| Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Anthropic | $3.00 | $15.00 | $0.30 | 1M |
| o3 | OpenAI | $2.00 | $8.00 | $0.50 | 200K |
| GPT-4.1 | OpenAI | $2.00 | $8.00 | $0.50 | 1M |
| Gemini 2.5 Pro (≤200K) | Google | $1.25 | $10.00 | — | 1M |
| Gemini 2.5 Pro (>200K) | Google | $2.50 | $15.00 | — | 1M |
| o4-mini | OpenAI | $1.10 | $4.40 | $0.28 | 200K |
| Claude Haiku 4.5 (`claude-haiku-4-5`) | Anthropic | $1.00 | $5.00 | $0.10 | 200K |

### Efficient / Open Models

| Model | Provider | Input /1M | Output /1M | Cache Read /1M | Context | Notes |
|-------|----------|-----------|------------|---------------|---------|-------|
| DeepSeek V4-Pro | DeepSeek | $0.44 | $0.87 | $0.004 | 1M | 75% promo through May 31 |
| Kimi K2 | Moonshot AI | $0.59 | $2.40 | $0.36 | 128K | Open weights |
| Llama 4 Maverick | Meta | $0.35 | $0.85 | $0.27 | 1M | Open weights |
| Gemini 2.5 Flash | Google | $0.30 | $2.50 | $0.03 | 1M | |
| DeepSeek V4-Flash | DeepSeek | $0.14 | $0.28 | $0.003 | 1M | |
| Gemini 2.5 Flash-Lite | Google | $0.10 | $0.40 | $0.01 | 1M | |

Grok 4.3 pricing: check [console.x.ai](https://console.x.ai). DeepSeek V4-Pro full post-promo price: $1.74/$3.48 input/output.

:::tip DeepSeek caching
DeepSeek V4 uses automatic KV caching. Cache hit: $0.004/M (V4-Pro) and $0.003/M (V4-Flash) — roughly 1% of the cache miss rate. No explicit user control needed.
:::

### Reasoning Model Cost Reality

Reasoning models generate internal thinking tokens billed at output rates. A hard problem may burn 10K–50K thinking tokens before producing a final answer.

```
o3 hard problem:
  Input:    5,000 tokens × $2.00/M   =  $0.010
  Thinking: 25,000 tokens × $8.00/M  =  $0.200  ← the real cost
  Output:   1,000 tokens × $8.00/M   =  $0.008
  Total:                               $0.218 per request
```

This applies to o3, o4-mini, GPT-5.5, Claude with adaptive thinking, DeepSeek V4-Pro in thinking mode, and Grok 4.3. At scale, routing to reasoning models only when the task requires it is critical.

## Cost Optimization

### 1. Prompt Caching — up to 90% savings

Reuse expensive context across requests. If your system prompt is 5K tokens and you handle 1,000 requests/day, you're paying for 5M tokens of identical input. Cache it and pay 10% of that on every cache hit.

See [Prompt Caching](/topics/prompt-caching) for the full breakdown.

### 2. Model Routing — match model to task difficulty

The biggest cost lever. Routing even half your traffic from a frontier model to a mid-tier model can cut costs 5–10x:

```
DeepSeek V4-Flash ($0.14/M) vs. GPT-5.5 ($5.00/M) = 36x difference
Gemini 2.5 Flash ($0.30/M) vs. Gemini 3.1 Pro Preview ($2.00/M) = 7x difference
Haiku 4.5 ($1.00/M) vs. Sonnet 4.6 ($3.00/M) = 3x difference
```

Route by signal:
- Classification, extraction, simple Q&A → small model
- Reasoning, code generation, complex instructions → frontier
- Nightly batch jobs with loose latency → batch API (50% discount on Anthropic)

### 3. Output Length Control

Output tokens cost more than input. Long outputs are expensive. Explicit instructions reduce waste:

```
❌ "Explain how X works"          → model decides length
✅ "In 2-3 sentences, explain X" → bounded
✅ "Return JSON only, no prose"  → eliminates filler
```

A model that adds preamble ("Great question! Let me explain...") before every answer costs you money on every request. Suppress it with explicit instructions.

### 4. Context Pruning

Every token you send costs money. Audit your prompts regularly:
- Remove few-shot examples once the model demonstrates consistent behavior
- Summarize old conversation history rather than appending indefinitely
- Truncate tool results to only the fields the model actually needs
- Eliminate redundant instructions repeated across system and user prompts

### 5. Batch Processing

When latency isn't a constraint, use batch APIs:

| Provider | Discount |
|---|---|
| Anthropic | 50% off (all Claude models) |
| OpenAI | 50% off |
| Google | Pricing varies by model |

Nightly analytics, classification pipelines, eval runs — these don't need real-time response. Move them to batch.

## Estimating Costs

Before building, run the math:

```
Daily requests: 10,000
Avg input tokens: 2,000  (system prompt + history + user message)
Avg output tokens: 500

Using Claude Sonnet 4.6:
  Input:  10,000 × 2,000 × $3.00/M  = $60.00/day
  Output: 10,000 × 500 × $15.00/M   = $75.00/day
  Total:                               $135.00/day → $4,050/month

Same traffic with Haiku 4.5:
  Input:  10,000 × 2,000 × $1.00/M  = $20.00/day
  Output: 10,000 × 500 × $5.00/M    = $25.00/day
  Total:                               $45.00/day → $1,350/month
```

The difference is $2,700/month before caching or routing optimization.

## Production Reality

**Output tokens dominate at scale** — developers obsess over prompt length but output is usually the larger cost driver in production. If your agents generate long responses, tightening output instructions pays more than trimming your system prompt.

**Prices change** — model pricing has dropped significantly year-over-year across all providers. The table above reflects May 2026 rates; verify current prices at [artificialanalysis.ai](https://artificialanalysis.ai) before committing to a model.

**Measure actual token usage in production** — your estimates will be wrong. Log `usage.input_tokens` and `usage.output_tokens` from API responses from day one. Dashboards that show "requests" without token breakdowns will mislead you on costs.

**Non-English amplifies everything** — if your product serves non-English users and you estimated costs in English, multiply by 2–4x as a starting point, then measure.
