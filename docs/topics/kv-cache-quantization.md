# KV Cache & Quantization

Memory optimization for inference.

## KV Cache

During autoregressive generation, the model must attend to all previously generated tokens. The KV cache stores the key and value vectors for these tokens to avoid recomputing them.

### The Problem

KV cache grows linearly with sequence length. For a 70B model:

- FP16 KV cache: ~2 bytes per parameter per token
- 4096-token sequence: ~1.3GB VRAM
- 128K sequence: ~41GB VRAM

This is why long context is expensive.

## Quantization

Reducing numerical precision to save memory and speed up computation.

| Format | Bits | Relative Speed | Relative Memory |
|--------|------|----------------|-----------------|
| FP32 | 32 | 1.0× | 1.0× |
| FP16 | 16 | ~1.5× | 0.5× |
| BF16 | 16 | ~1.5× | 0.5× |
| INT8 | 8 | ~2.0× | 0.25× |
| INT4 | 4 | ~3.0× | 0.125× |

### KV Cache Quantization

Specialized techniques for compressing the KV cache:

- **Q-KV** — Per-head quantization of K and V matrices.
- **StreamingLLM** — Evict old tokens, keep only recent + attention sinks.
- **H2O (Heavy Hitter Oracle)** — Keep only tokens with high attention scores.

:::info
Quantization is lossy. INT4 can degrade quality for complex reasoning tasks. Always benchmark before deploying quantized models in production.
:::
