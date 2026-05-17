# Agent Infrastructure

_Last updated: May 17, 2026_

The systems that make inference economical at scale. A model that works in a notebook will not work in production without this layer: serving, caching, routing, and observability each carry their own tradeoffs.

## The Production Decision

Infrastructure choices are primarily cost and reliability decisions:

- Managed API or self-hosted inference — who owns the SLA?
- Do you have repeated context that justifies caching?
- Does your workload have enough model diversity to benefit from routing?
- Can you actually observe what your agents are doing and what they cost?

## Model Serving

Turning a model file (or API key) into a production inference endpoint.

### Managed Inference

Pay per token, zero ops burden. The right default for most products:

| Provider | Strengths | Weaknesses |
|----------|-----------|------------|
| OpenAI | Largest ecosystem, fast model/tool iteration, strong enterprise controls | Premium frontier pricing, regional processing depends on project eligibility and region support |
| Anthropic | Strong instruction following, explicit prompt caching, long-context options | Smaller model selection, some long-context options are tier-gated or beta |
| Google Vertex | GCP integration, strong multimodal and long-context options | Product surface split across Vertex and Gemini API, model-specific quotas vary |
| Together AI | Open-weight model catalog | Less predictable availability |
| Fireworks AI | Fast open-weight inference | Smaller model selection |
| Groq | Extremely fast TTFT (LPU hardware) | Limited models, no fine-tuning |

### Self-Hosted Inference

Own the hardware, own the SLA. Worth considering when:
- You process >10M tokens/day and managed costs are prohibitive
- Data sovereignty or compliance requires on-premise
- You need fine-tuned models managed APIs do not support

| Stack | Best for |
|-------|----------|
| vLLM | General-purpose serving, strong throughput, PagedAttention |
| SGLang | High concurrency with structured generation |
| TGI (Text Generation Inference) | Hugging Face ecosystem, quick setup |
| TensorRT-LLM | Maximum GPU throughput on NVIDIA hardware |
| llama.cpp | CPU/Mac inference, GGUF models |

[LLM Serving →](/topics/llm-serving)

## Prompt Caching

Reusing the KV cache from previous requests. The highest-leverage infrastructure optimization for agents with repeated context.

### When it applies

- **System prompts** — Same instructions sent with every request. Cache them.
- **Few-shot examples** — Static examples in every prompt. Cache them.
- **[RAG](/topics/embeddings) context** — Documents retrieved for a query. Cache if the retrieved docs are stable across requests.
- **Long conversation history** — As history grows, older turns can be cached.

### Savings by provider

> Current as of May 2026. Verify cache pricing and availability against provider docs before committing to a platform.

| Provider | Cache pricing | Min cacheable tokens |
|----------|--------------|---------------------|
| Anthropic | Write: 1.25× input; Read: 0.1× input | 1,024 |
| OpenAI | Automatic; cached input pricing is model-specific (for example, 0.1× on GPT-5.5 and 0.25× on GPT-4.1) | 1,024 |
| Google | Implicit caching on supported models; explicit caching adds storage cost | Model-specific; commonly 1,024-4,096 |
| DeepSeek | Read: 0.1× input | 64 |

The break-even on Anthropic caching: if a cached prefix is reused more than ~1.2 times, you save money. For production agents with stable system prompts, the first request pays for all subsequent ones.

[Prompt Caching →](/topics/prompt-caching)

## Routing

Directing each request to the right model based on task characteristics. Done well, routing cuts costs by 40–70% with no quality loss on the simple majority of requests.

### Routing strategies

**Complexity-based** — Classify requests as simple or complex before calling an LLM. Simple → fast cheap model (DeepSeek V4-Flash, Gemini Flash). Complex → frontier model.

**Cost-capped** — Set a per-request token budget. If the request fits, use a cheap model. If not, escalate.

**Cascade** — Call a cheap model first. If it returns a low-confidence response, re-run with a stronger model.

**Capability-based** — Route by what the task requires: vision → multimodal model, code → code-optimized model, reasoning → reasoning model.

### What to measure

Route quality degrades silently. You need evals on the routed distribution, not just the full-model baseline. If routing sends 70% of traffic to a cheap model and that model fails on 10% of those cases, you have a real quality problem that aggregate metrics will not surface.

[Evaluations →](/topics/evals) | [Latency →](/topics/latency)

## Observability

You cannot optimize what you cannot see. At scale, inference is a cost center with hidden structure — the same agent call can vary 10× in cost depending on cache state, model selection, and context length.

### What to instrument

| Signal | Why it matters |
|--------|----------------|
| Tokens in / tokens out per call | Primary cost driver |
| Cache hit rate | Measures caching effectiveness |
| Time to first token (TTFT) | Perceived latency for streaming |
| Total generation time | Batch job throughput |
| Model used per request | Routing effectiveness |
| Error rate by model | Reliability comparison |
| Cost per user session | Unit economics signal |

### Tooling

- **LangSmith** — Tracing for LangChain-based agents; native span tracking
- **Langfuse** — Open-source, self-hostable, model-agnostic
- **Helicone** — Proxy-based; works with any OpenAI-compatible API
- **Braintrust** — Combines tracing and evals in one platform
- **Custom span logging** — For non-framework agents, structured JSON logs with trace IDs are often enough

The minimum viable setup: log every LLM call with model, token counts, latency, and a session ID. That alone tells you 80% of what you need to know.

[Rate Limits & Concurrency →](/topics/rate-limits)

## Production Reality

**Managed APIs have outages.** OpenAI, Anthropic, and Google have all had multi-hour incidents. If your product depends on a single provider, design a fallback model or a graceful degradation path. The fallback does not need to be equivalent — it just needs to keep the product functional.

**Caching requires stable prefixes.** If your system prompt includes timestamps, user IDs, or any dynamic content before the cacheable block, you will never get a cache hit. Structure prompts so all static content comes first, dynamic content last.

**Routing adds latency at the classification step.** A classifier that takes 200ms to route a request has already spent 200ms before inference starts. Use lightweight classifiers — small local models, keyword heuristics, or routing by request metadata — rather than full LLM calls.

**Observability is non-negotiable for billing disputes.** At scale, provider invoices will occasionally be wrong or surprising. Your own token logs are the only way to reconcile them.
