# Tokens & Cost

The fundamental unit of LLM economics.

## What is a Token?

A token is a piece of text — roughly 0.75 words in English, or 1-2 characters in some languages. Models do not see text; they see token IDs.

## Pricing Models

| Provider | Input (per 1M tokens) | Output (per 1M tokens) | Notes |
|----------|----------------------|------------------------|-------|
| GPT-4o | $2.50 | $10.00 | Standard tier |
| Claude 3.5 Sonnet | $3.00 | $15.00 | Strong reasoning |
| DeepSeek-V3 | $0.14 | $0.28 | Cost-efficient MoE |
| Kimi K2 | $0.50 | $2.00 | 2M context |

## Cost Optimization

- **Prompt caching** — Reuse KV cache for repeated prefixes. Can reduce cost by 90%.
- **Shorter prompts** — Remove unnecessary context. Every token costs money.
- **Cheaper models for easy tasks** — Route simple queries to smaller/cheaper models.
- **Batching** — Process multiple requests together when latency allows.

:::tip Cache Math
If your prompt prefix is 10K tokens and you make 100 requests, caching saves you from paying for 1M input tokens at full price. At GPT-4o rates, that is $2.50 saved per 100 calls.
:::
