# Latency

The time between request and response.

## Key Metrics

### TTFT (Time to First Token)

The delay before the model starts generating. Dominated by:

- Network round-trip
- Tokenization
- Forward pass on the full prompt
- KV cache loading

### TPOT (Time Per Output Token)

The time to generate each subsequent token. Dominated by:

- Autoregressive generation (one token at a time)
- KV cache memory bandwidth
- Model size and quantization

### Total Latency

```
Total = TTFT + (TPOT × output_token_count)
```

## Optimization Strategies

- **Streaming** — Send tokens as they are generated. Improves perceived latency.
- **Speculative Decoding** — Draft tokens with a small model, verify with the large model.
- **Quantization** — Smaller weights = faster memory access.
- **Batching** — Process multiple requests together. Better throughput, worse single-request latency.

## The Latency-Cost Tradeoff

| Strategy | Latency | Cost | Complexity |
|----------|---------|------|------------|
| Streaming | Better (perceived) | Same | Low |
| Speculative decoding | Better | Same | High |
| Quantization (INT8) | Better | Same | Medium |
| Batching | Worse (single) | Better | Medium |
| Larger GPU | Better | Worse | Low |
