# Rate Limits & Concurrency

Production constraints for LLM APIs.

## Common Limits

| Provider | RPM (Requests/min) | TPM (Tokens/min) | Notes |
|----------|-------------------|------------------|-------|
| OpenAI | Tier-dependent | Tier-dependent | Starts at 60 RPM |
| Anthropic | 50 – 4000 | 40K – 400K | Tier-based |
| DeepSeek | 1000+ | Very high | Generous limits |

## Concurrency Models

### Request Queue

Incoming requests are queued and sent to the API at the allowed rate. Simple but adds latency.

### Token Bucket

Requests consume tokens from a bucket that refills over time. Allows bursts within limits.

### Adaptive Backoff

Monitor 429 responses and dynamically adjust request rate. Essential for production systems.

## Best Practices

- **Monitor headers** — Most APIs return `x-ratelimit-*` headers.
- **Implement retries** — Exponential backoff with jitter.
- **Track token usage** — TPM limits are often the real bottleneck.
- **Use multiple keys** — Distribute load across API keys or providers.

:::warning
Hitting rate limits in production causes cascading failures. Always design for backoff and queueing from day one.
:::
