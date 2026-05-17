# Rate Limits & Concurrency

_Last updated: May 17, 2026_

API quotas that cap how much you can send per unit of time. Hitting them in production causes request failures, cascading queue buildup, and degraded user experience. Design for them from the start.

## The Decision

Rate limits affect your architecture in two ways:

1. **Can your system handle the traffic you're planning for?** — check whether your expected volume fits within your tier
2. **What happens when you're throttled?** — you will get 429s in production; have a plan before you need it

## Current Provider Patterns (May 2026)

Limits usually increase as you spend more, but the important engineering detail is not the exact headline table. It is how each provider scopes the bucket, which dimensions they meter, and whether long-context or batch traffic has separate handling.

> Current as of May 2026. Treat the notes below as architecture guidance plus representative examples. Verify exact limits in the provider dashboard and docs before sizing production traffic.

### Anthropic

Anthropic meters the Messages API in:
- RPM
- input tokens per minute (ITPM)
- output tokens per minute (OTPM)

Key behaviors:
- limits are enforced at the organization level
- limits are model-class specific
- some models count cache-read tokens toward ITPM and others do not
- long-context Sonnet 4 requests over 200K tokens can have separate limits from standard requests

Representative example:
- entry-tier Claude Sonnet 4 / Opus 4 limits are currently much tighter on tokens than many builders expect, with 50 RPM and 30K ITPM / 8K OTPM being the official standard starting point

Anthropic tracks **input** and **output** tokens separately. Output TPM limits are often the bottleneck for verbose agents.

### OpenAI

OpenAI exposes a broader set of buckets:
- RPM
- TPM
- RPD
- TPD
- IPM for image endpoints

Key behaviors:
- limits are defined at both organization and project level
- limits vary by model family
- some models share a rate-limit bucket with sibling models
- long-context requests can have separate limits from standard requests
- batch queue limits are separate from synchronous request limits

OpenAI limits vary significantly by model. Check the Limits page for the exact model group you plan to ship, not just your account tier.

### Google (Gemini API)

Gemini rate limits are highly model-specific and usually documented in RPM, TPM, and daily request caps.

Key behaviors:
- free and paid plans have materially different limits
- Gemini tends to be more generous on token volume than on request count
- grounding, live API usage, and some multimodal paths can have separate caps

For many Gemini workloads, the bottleneck is requests-per-minute rather than tokens-per-minute.

### DeepSeek

DeepSeek documents rate limiting more in terms of dynamic concurrency and current server load than stable public tier tables.

Key behaviors:
- concurrency can be reduced dynamically during load spikes
- published pricing is easier to rely on than published throughput ceilings
- migrations between legacy and current model families can change the practical limit surface

Legacy models `deepseek-chat` and `deepseek-reasoner` retire July 24, 2026. If you still depend on them, migrate to `deepseek-v4-flash` or `deepseek-v4-pro`.

## Limit Types

**RPM (Requests Per Minute)** — caps the number of API calls regardless of size. Relevant when you're making many small requests.

**TPM (Tokens Per Minute)** — caps total token volume. Relevant when requests are large (long prompts, long outputs, or both). TPM limits are often the real bottleneck in production, especially for agentic systems with long context.

**Concurrent requests** — some providers also limit simultaneous in-flight requests, separate from RPM. This matters for highly parallel workloads.

## Handling Rate Limits

### Exponential Backoff with Jitter

The baseline. When you receive a 429, wait and retry with increasing delays. Add jitter (random offset) to prevent synchronized retries from multiple clients creating traffic spikes.

```python
import time
import random

def with_backoff(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait)
```

Most provider SDKs include this behavior. Use it: `from anthropic import Anthropic` with default retry config handles exponential backoff automatically.

### Token Bucket / Rate Limiter

Proactively limit your request rate before hitting the API, rather than reacting to 429s. A token bucket refills at your allowed rate; requests consume tokens and are queued when the bucket is empty.

```python
from ratelimit import limits, sleep_and_retry

@sleep_and_retry
@limits(calls=50, period=60)  # Example limiter: tune to your actual bucket
def call_api(prompt):
    return client.messages.create(...)
```

This prevents 429s rather than recovering from them — better for latency-sensitive workloads.

### Queue + Worker Pool

For batch workloads, decouple request submission from execution with a work queue. Workers consume from the queue at a rate that respects limits.

```
Producers → [Queue] → Workers (rate-limited) → API
```

Libraries: `asyncio.Semaphore` for async concurrency limits, `celery` or `arq` for distributed queues.

### Monitor Rate Limit Headers

Every major provider returns rate limit state in response headers. Log them to see how close you are to the limit before you hit it.

```python
response = client.messages.create(...)

# Anthropic headers
remaining_requests = response.headers.get("anthropic-ratelimit-requests-remaining")
remaining_tokens = response.headers.get("anthropic-ratelimit-tokens-remaining")
reset_time = response.headers.get("anthropic-ratelimit-requests-reset")
```

OpenAI uses `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-requests`.

### Multi-Provider Fallback

Route to a secondary provider when the primary is throttled:

```python
async def complete(prompt: str) -> str:
    try:
        return await anthropic_client.complete(prompt)
    except RateLimitError:
        return await openai_client.complete(prompt)
```

Requires compatible prompts across providers and acceptance that outputs may differ. Useful for high-volume workloads where any degradation of primary capacity risks user-facing failures.

### Distribute Across API Keys

Within a single provider, distributing load across multiple API keys multiplies your effective limits. This is within ToS for most providers when keys are for legitimate separate usage contexts (different products, services, or teams) — check each provider's terms for the specifics.

## TPM vs. RPM: Which Will You Hit?

Run the math before building:

```
Expected traffic: 100 req/min
Avg input tokens: 3,000 per request
Avg output tokens: 500 per request

Required input TPM: 100 × 3,000 = 300,000
Required output TPM: 100 × 500 = 50,000
Required RPM: 100

Example provider limits:
  RPM: 2,000 ✅ (100 needed)
  Input TPM: 160,000 ❌ (300,000 needed)
  Output TPM: 32,000 ❌ (50,000 needed)
→ Need a higher token bucket or shorter prompts
```

If your prompts include large context (retrieved docs, conversation history), token limits bind long before request limits.

## Batch API as a Rate Limit Bypass

For workloads that don't need real-time responses, the Batch API sidesteps standard rate limits. Anthropic and OpenAI both offer batch processing at 50% discount with 24-hour turnaround. Batch jobs are not subject to the same RPM/TPM limits as synchronous requests.

Good candidates: eval runs, nightly processing jobs, data enrichment pipelines.

## Production Reality

**TPM is almost always the binding limit** — developers think about RPM (requests) and forget that each request can be thousands of tokens. Monitor your TPM utilization, not just your error rate.

**Bucket scope varies by provider** — do not assume rate limits are per key. OpenAI scopes limits at organization and project level; Anthropic scopes them at organization level and allows workspace controls. Multiple services can still interfere with each other if they share the same upstream bucket.

**Limits increase automatically as you spend** — providers advance you to higher tiers based on historical spend. If you're routinely hitting limits, spending more may unlock higher tiers. Check your provider dashboard for current tier and advancement thresholds.

**Cascading failures are the real risk** — a spike in traffic that triggers rate limiting can cause request timeouts, which causes retries, which amplifies the spike, which causes more rate limiting. Circuit-breaker patterns prevent this from spiraling. Fail fast and return an error to the user rather than queuing unlimited retries.

**Build observability first** — you cannot debug rate limit issues in production without metrics on: tokens per request (input/output), requests per minute, 429 error rate, and retry counts. Set these up before your first production deployment, not after the first incident.
