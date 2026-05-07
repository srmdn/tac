# Prompt Caching

Reusing computation across requests.

## How It Works

When multiple requests share the same prompt prefix, the KV cache from the first request can be reused for subsequent requests. This skips the expensive forward pass on the shared portion.

```
Request 1: [System Prompt + User Context + Question A]
           ↓ compute KV cache for entire prompt

Request 2: [System Prompt + User Context + Question B]
           ↓ reuse KV cache for prefix → only compute new suffix
```

## Cache Metrics

- **Cache Read** — Tokens served from cache. Cheaper than full computation.
- **Cache Write** — Tokens stored in cache. Happens on first encounter.
- **Cache Hit Rate** — Percentage of tokens served from cache. Higher is better.

## Providers

| Provider | Caching Support | Pricing |
|----------|----------------|---------|
| Anthropic | Full | 25% of input price for cache read |
| OpenAI | Beta | 50% of input price for cache read |
| DeepSeek | Partial | Varies |

## Best Practices

- Put static content first (system prompt, context).
- Put dynamic content last (user question, current data).
- Monitor cache hit rates. A low hit rate means your prefix is too dynamic.

:::tip
A 90% cache hit rate on a 10K token prefix effectively reduces your input cost by 90% on the shared portion. This is the single most effective cost optimization for multi-turn agents.
:::
