# Latency

The gap between sending a request and receiving a complete response. For most user-facing applications, latency determines whether the product feels usable. For agentic pipelines, it determines whether multi-step workflows complete in seconds or minutes.

## The Decision

Before optimizing, identify which metric you actually care about:

- **Perceived latency** (how fast does it feel?) → optimize TTFT, enable streaming
- **Total wall time** (how long until the task is done?) → optimize TPOT, reduce output length, parallelize
- **Pipeline throughput** (how many tasks per hour?) → batching, async execution

These require different interventions. Chasing the wrong metric wastes effort.

## Key Metrics

### TTFT — Time to First Token

The delay from sending the request until the first output token arrives. This is what determines whether an interface feels "responsive" to a user.

What drives TTFT:
- **Network round-trip** to the API endpoint (typically 20–150ms depending on region)
- **Prefill computation** — the model's forward pass over the entire input prompt. Long prompts = slower TTFT.
- **Queue wait** — at high load, requests wait behind other requests

TTFT scales with **input length**. A 100K-token prompt can have TTFT of several seconds even on fast infrastructure, because prefill is inherently sequential per layer.

> Current as of May 2026. The latency snapshots below are representative benchmark numbers, not SLOs. They move with provider load, prompt length, reasoning mode, and region.

**Typical TTFT ranges (managed APIs, 2026) — source: [artificialanalysis.ai](https://artificialanalysis.ai):**

| Provider / Model | Typical TTFT |
|-----------------|--------------|
| Groq (fast models) | 100–300ms |
| Gemini 2.5 Flash | ~670ms |
| Anthropic (Haiku 4.5) | 300–700ms |
| Anthropic (Sonnet 4.6) | ~1.4s |
| GPT-4.1 | ~970ms |
| Gemini 3.1 Pro Preview | ~28s (reasoning) |
| Anthropic (Opus 4.7) | ~21s (adaptive thinking) |
| GPT-5.5 (high effort) | ~24s (reasoning) |

TTFT varies significantly with load, prompt length, reasoning mode, region, and time of day. Non-reasoning variants of the same model have dramatically lower TTFT than reasoning variants.

### TPOT — Time Per Output Token

Time to generate each token after the first. Determines how fast a long response streams in.

What drives TPOT:
- **Model size** — larger models need more memory bandwidth per forward pass
- **KV cache size** — grows with every token generated, increasing memory bandwidth demands
- **Batch size** — at serving layer, more concurrent requests in a batch increase TPOT

**Typical TPOT ranges:**

| Model class | Typical TPOT |
|-------------|-------------|
| Fast inference providers (Groq) | 5–15ms/token (~65–200 tok/s) |
| Hosted frontier models | 15–40ms/token (~25–65 tok/s) |
| Self-hosted (A100, vLLM) | 20–50ms/token (~20–50 tok/s) |
| Edge/local (llama.cpp, M-series) | 50–200ms/token (~5–20 tok/s) |

### Total Latency

```
Total = TTFT + (TPOT × output_token_count)
```

A 500-token response at 30ms/token adds 15 seconds of generation time after the first token. Total response time depends heavily on how much you're asking the model to write.

## Optimization Strategies

### Streaming

Stream tokens to the client as they're generated instead of waiting for completion. Eliminates the perception of "waiting for the full response" — users see text appearing immediately.

Streaming doesn't reduce total latency; it reduces *perceived* latency. Use it for every interactive application.

```python
with client.messages.stream(model="claude-sonnet-4-6", ...) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### Reduce Input Length

Shorter prompts = lower TTFT. Expensive in agentic systems where tool results accumulate.

Tactics:
- Truncate tool results to only what the model needs
- Summarize old conversation history
- Remove redundant instructions

### Reduce Output Length

Output length directly multiplies TPOT. If your model generates 2× longer responses than needed, your total latency doubles.

```
"Explain this code"     → verbose response, higher latency
"Summarize in 2 lines"  → bounded output, lower latency
"Return JSON only"      → eliminates prose preamble
```

### Speculative Decoding

A small "draft" model generates several tokens speculatively; the large model verifies them in a single forward pass. When the draft is correct, you get multiple tokens for the cost of one large model pass. Typical speedup: 2–3× TPOT.

Available in vLLM and TGI for self-hosted deployments. Anthropic's API uses it internally.

### Smaller / Faster Models

The simplest optimization. If a smaller model meets your quality bar, use it.

```
Gemini 2.5 Flash: ~190 tok/s (5ms/token)
Claude Sonnet 4.6: ~43 tok/s (23ms/token)
→ 4× speed improvement at 1/5th the cost
```

Groq's LPU (Language Processing Unit) hardware achieves 200–500 tok/s on smaller models — the fastest option for latency-critical, quality-tolerant use cases.

### Parallelization

In multi-step pipelines, run independent steps concurrently:

```python
# Sequential: 3 × 2s = 6s
result_a = await call_model(prompt_a)
result_b = await call_model(prompt_b)
result_c = await call_model(prompt_c)

# Parallel: max(2s, 2s, 2s) = 2s
results = await asyncio.gather(
    call_model(prompt_a),
    call_model(prompt_b),
    call_model(prompt_c)
)
```

### Prompt Caching

Caching eliminates prefill computation for repeated prefixes. Large system prompts that would normally drive TTFT up are served from cache with near-zero computation cost. See [Prompt Caching](/topics/prompt-caching).

## Latency Budget

For interactive features, define a budget before you build:

| Feature type | Acceptable total latency |
|---|---|
| Autocomplete / inline suggestion | < 500ms |
| Chatbot first token | < 1s |
| Single-step task completion | < 5s |
| Multi-step agentic task | < 30s (with progress indication) |
| Background job / batch | No strict limit |

If your design doesn't fit the budget, change the design — not the model. Switching from a frontier model to an efficient model (Gemini 2.5 Flash, DeepSeek V4-Flash) saves 4–10× latency; redesigning a 10-step sequential agent as 3 parallel tasks saves 70%.

## Production Reality

**TTFT dominates perception** — users tolerate a slow stream far better than a long blank pause before text appears. If you can only optimize one metric for interactive use, optimize TTFT.

**Agentic loops compound latency** — every tool call round-trip adds latency. A 5-step agent loop with 1.5s per step takes 7.5 seconds before responding to the user. Profile each step; parallelize what you can.

**Rate limits impose latency floors** — when you're throttled, added latency comes from queue wait, not model speed. Monitor `x-ratelimit-*` headers and distinguish rate-limit latency from model latency in your metrics.

**Cold starts on serverless deployments** — if your inference server is deployed on serverless infrastructure, the first request after idle may trigger a cold start. Warm your infrastructure with periodic keep-alive requests or use reserved capacity.

**Network geography matters** — routing requests to an endpoint in the same region as your users saves 50–200ms in round-trip. For latency-sensitive products, pick providers with regional endpoints.

**Benchmark pages age fast** — latency rankings are among the least stable facts in the stack. Use public benchmarks to form hypotheses, then measure under your own prompt shape and user geography.

## Related Topics

- [LLM Serving](/topics/llm-serving) — for infrastructure choices that shape throughput and cold-start behavior
- [Prompt Caching](/topics/prompt-caching) — for one of the biggest TTFT reductions available on repeated prompts
- [Orchestration](/topics/orchestration) — for the multi-step agent patterns that multiply latency
