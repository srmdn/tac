# Prompt Caching

Reusing the KV cache from a previous request instead of recomputing it. For workloads with large repeated context — system prompts, few-shot examples, [RAG](/topics/embeddings) documents — caching is the single highest-ROI cost optimization available.

## The Decision

Cache anything that stays the same across requests and is long enough for savings to matter. If you have a 5K-token system prompt and handle 100 requests, you're paying for 500K tokens of identical computation on every run. Cache it and pay 10% of that on each cache hit.

Quick check:
- Fixed system prompt > 1K tokens? Cache it.
- Few-shot examples that don't change? Cache them.
- Large document the user repeatedly asks questions about? Cache it.
- Short, highly dynamic prompts? Don't bother — the overhead isn't worth it.

## How KV Caching Works

During a forward pass, the model computes key-value tensors for every token in the input. These tensors represent the model's "understanding" of that text. Normally, they're discarded after each request.

With prompt caching, the server stores these KV tensors and reuses them if the same prefix appears in a future request. The model skips recomputation and jumps straight to generating from the cached state. This saves both compute and — critically — the time to compute it.

**The prefix rule**: the cache matches from the beginning of the prompt. If characters 1–5000 are identical across requests, they hit the cache. If character 1 changes, nothing hits.

## Provider Support

### Anthropic

Explicit cache control with configurable TTL.

| Operation | Cost multiplier (vs. base input) | Effective price (Sonnet 4.6) |
|-----------|----------------------------------|------------------------------|
| Cache write (5 min TTL) | 1.25× | $3.75/M |
| Cache write (1 hr TTL) | 2.0× | $6.00/M |
| Cache read (hit) | 0.1× | $0.30/M |

You mark cache breakpoints in your prompt using `cache_control`:

```python
messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": system_prompt_text,  # large fixed block
                "cache_control": {"type": "ephemeral"}  # 5-min TTL
            },
            {
                "type": "text",
                "text": user_question
            }
        ]
    }
]
```

**Break-even:**
- 5-min cache: you pay 1.25× to write, then 0.1× per hit. Positive on the second request.
- 1-hr cache: you pay 2× to write, then 0.1× per hit. Positive on the third request.

```
5-min break-even (10K token prefix, Sonnet 4.6):
  No cache:    10K × $3.00/M = $0.030 per request
  Cache write: 10K × $3.75/M = $0.0375 (first request)
  Cache hit:   10K × $0.30/M = $0.003  (every subsequent request)
  Savings per hit: $0.027 (90%)
  Break-even: achieved on request #2
```

Minimum cacheable prefix: 1,024 tokens (Haiku); 2,048 tokens (Sonnet and Opus models).

### OpenAI

Automatic — no code changes required.

| Operation | Cost vs. base input |
|-----------|---------------------|
| Cache write | No extra charge |
| Cache read (hit) | 0.5× (50% savings) |

OpenAI caches any prompt prefix longer than 1,024 tokens automatically. The cache uses a sliding window with a TTL of roughly 5–10 minutes. You don't mark anything; the API returns a `cached_tokens` field in the usage object showing how many tokens were served from cache.

```python
response = client.chat.completions.create(...)
cached = response.usage.prompt_tokens_details.cached_tokens
```

Cached input prices:
| Model | Uncached | Cached | Savings |
|-------|----------|--------|---------|
| GPT-5.5 | $5.00/M | $0.50/M | 90% |
| GPT-4.1 | $2.00/M | $0.50/M | 75% |
| o3 | $2.00/M | $0.50/M | 75% |
| o4-mini | $1.10/M | $0.275/M | 75% |

Automatic caching means you get savings when they happen; you don't get the control to guarantee they happen.

### Google (Gemini)

Explicit context caching with a storage fee.

| Operation | Cost |
|-----------|------|
| Cache read | ~10% of base input rate |
| Storage | $1.00/M tokens per hour |
| Minimum cache size | 32,768 tokens |
| Minimum TTL | 1 hour |

```python
import datetime
from google import genai

client = genai.Client()
cache = client.caches.create(
    model="gemini-2.5-flash",
    contents=[large_document],
    ttl=datetime.timedelta(hours=2)
)
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=user_question,
    config=genai.types.GenerateContentConfig(cached_content=cache.name)
)
```

The storage fee means long TTLs aren't always cheaper. A 100K token cache costs $0.10/hour to store. If you're not hitting it frequently, storage dominates.

**Break-even (Gemini 2.5 Flash, 100K token document, 1-hr TTL):**
```
Storage cost: 100K × $1.00/M × 1hr = $0.100/hour
Cache read savings per hit: 100K × ($0.30 − $0.03)/M = $0.027/hit
Break-even: ~4 hits per hour just to cover storage
```

Gemini context caching is only worthwhile at meaningful request volume.

### DeepSeek

Fully automatic, no user control.

| Operation | DeepSeek V4-Pro | DeepSeek V4-Flash |
|-----------|----------------|-------------------|
| Cache hit | $0.004/M | $0.003/M |
| Cache miss | $0.44/M | $0.14/M |
| Savings on hit | ~99% | ~98% |

DeepSeek V4's cache discount is extraordinary — cache hits cost roughly 1% of cache miss rate. Legacy models `deepseek-chat` and `deepseek-reasoner` retire July 24, 2026 and are routing to V4-Flash variants now.

## What to Cache

**High value** — changes rarely, tends to be large:
- System prompts with detailed instructions, personas, output formats
- Few-shot examples demonstrating behavior
- Tool definitions (especially large schemas)
- Retrieved documents queried multiple times in a session

**Low value** — changes per request:
- The user's actual message
- Dynamic context (current date, user ID, session state)
- Personalized content

The most common pattern is to front-load all stable content before dynamic content:

```
[CACHED PREFIX]
System prompt: "You are a customer support agent..."  ← 2,000 tokens
Product documentation                                 ← 15,000 tokens
Few-shot examples                                     ← 3,000 tokens

[NOT CACHED]
Conversation history: varies per user
User message: varies per request
```

## Structuring Prompts for Cache Efficiency

Cache matching is prefix-only. Any dynamic content before the cache boundary breaks it.

```
❌ Bad — dynamic content early:
"Today is {date}. You are a helpful assistant. [5,000 token instructions]..."
→ date changes daily → nothing caches

✅ Good — stable content first:
"You are a helpful assistant. [5,000 token instructions]...
---
Current date: {date}
User: {message}"
→ everything before the separator caches
```

Put the largest, most stable content first. Put dynamic content last.

## Cache Miss Budget

Caches expire. Account for re-write cost in your model:

```
Anthropic 5-min TTL, 10K token prefix, 1,000 req/hour:
  12 cache writes/hour: 12 × 10K × $3.75/M   = $0.00045/hr
  ~988 cache reads:     988 × 10K × $0.30/M  = $0.00296/hr
  No-cache baseline:    1,000 × 10K × $3.00/M = $0.030/hr
  Effective cost:       ~$0.003/hr (90% savings)
```

At low request rates (fewer than one request per TTL), you pay write cost without enough reads to amortize it. For light workloads, prefer OpenAI's automatic caching (no write cost) or skip caching.

## Production Reality

**Monitor your cache hit rate** — providers return cache hit data in the API response. Log `cached_tokens` (OpenAI) or the cache usage fields (Anthropic). A hit rate below 80% on an expected-to-cache workload means your prefix isn't stable enough, TTL is too short, or volume is too low.

**Cache invalidation is manual** — if you update your system prompt, old caches serve until expiry. With a 1-hour Gemini cache, you get up to an hour of stale responses after a prompt change. Account for this in your deploy workflow.

**Conversation history breaks prefix caching** — each new turn appends to history, pushing the dynamic boundary earlier. For multi-turn agents, cache only the system prompt (stable prefix); don't try to cache conversation history.

**Parallel requests fight for the same cache slot** — if two requests arrive simultaneously with the same prefix, only one populates the cache. The other pays full compute cost. At high concurrency, realized hit rates are lower than theoretical.

**Test before assuming savings** — cache hit rates vary by traffic patterns, prompt structure, and provider infrastructure. The only reliable way to know your actual savings is to measure in production.
