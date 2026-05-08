# KV Cache & Quantization

Two independent memory optimization techniques that are often discussed together because they both determine how much VRAM you need — and therefore what you can afford to run and at what context length.

## The Decision

If you're using managed APIs, quantization is not your problem — providers handle it. This page matters when:
- You're evaluating self-hosted deployment options
- You're trying to understand why long context is expensive
- You're choosing between model variants (FP16 vs. INT4, etc.)

## KV Cache

During autoregressive generation, the model computes attention over every previously generated token. The key-value (KV) tensors from those computations are cached and reused — the "KV cache."

Without it, generating token N would require re-running attention over all N-1 prior tokens from scratch. With the KV cache, only the new token's attention needs to be computed; everything else is looked up from memory.

**The problem:** KV cache size grows linearly with sequence length and model size.

### KV Cache Memory Math

```
KV cache size = 2 × layers × heads × head_dim × seq_len × bytes_per_element
```

For a Llama 3 70B model in FP16:
- 80 layers, 64 heads, 128 head dimensions
- FP16 = 2 bytes per element

| Sequence length | KV cache VRAM |
|-----------------|--------------|
| 4K tokens | ~3.5 GB |
| 32K tokens | ~27 GB |
| 128K tokens | ~109 GB |

This is additive to the model weights (~140 GB for Llama 3 70B in FP16). Long context doesn't just test the context window limit — it strains VRAM.

### PagedAttention

vLLM's key innovation. Traditional inference servers pre-allocate a contiguous VRAM block for the maximum possible sequence length, even if most requests are short. This wastes VRAM on every short request.

PagedAttention stores KV cache in non-contiguous pages (like OS virtual memory). Each request gets pages as needed; pages are freed when the request completes. Result: 2–4× higher GPU utilization and throughput on typical workloads.

### KV Cache Compression Techniques

For very long contexts or limited VRAM:

**KV cache quantization** — store K and V tensors in INT8 or INT4 instead of FP16. Halves or quarters the VRAM cost with minor quality degradation at moderate sequence lengths.

**StreamingLLM** — evict old tokens' KV cache, keeping only recent tokens and the initial "attention sink" tokens (the first few tokens that receive disproportionate attention in most models). Allows infinite-length generation with fixed VRAM, at the cost of losing access to middle-context information.

**H2O (Heavy Hitter Oracle)** — selectively evict tokens with low attention scores, keeping only "heavy hitters." Better quality than StreamingLLM's fixed-window approach for tasks where important tokens are scattered throughout the context.

## Quantization

Quantization reduces the numerical precision of model weights (and optionally KV cache) to fit more into VRAM and speed up computation.

### Precision Formats

| Format | Bits | VRAM vs. FP32 | Speed vs. FP32 | Quality loss |
|--------|------|---------------|----------------|--------------|
| FP32 | 32 | 1.0× (baseline) | 1.0× | None (reference) |
| BF16 | 16 | 0.5× | ~1.5× | Minimal |
| FP16 | 16 | 0.5× | ~1.5× | Minimal |
| INT8 (W8A16) | 8 | 0.25× | ~1.8× | Low |
| INT4 (GPTQ/AWQ) | 4 | 0.125× | ~2.5× | Moderate |
| INT4 (EXL2 mixed) | ~4 avg | ~0.125× | ~2.5× | Low–moderate |
| GGUF Q4_K_M | ~4 avg | ~0.125× | varies | Low–moderate |

BF16 is the modern standard for training and high-quality inference. FP16 and BF16 are nearly equivalent in practice; BF16 has better dynamic range for large values.

### Quantization Methods

**GPTQ** — post-training quantization using a second-order optimization. Good quality-per-bit; slower to apply than simpler methods. Standard for 4-bit GPU inference.

**AWQ (Activation-Aware Weight Quantization)** — protects salient weights (those with large activations) from aggressive quantization. Better quality than GPTQ at the same bit-width, especially for instruction-following tasks.

**EXL2** — finer-grained per-layer bitwidth allocation. Assigns more bits to critical layers, fewer to less sensitive ones. Best quality-per-bit among 4-bit methods; NVIDIA-only.

**GGUF (llama.cpp format)** — quantization format designed for CPU + GPU hybrid inference. Supports a range of quantization levels (Q2 through Q8). The `Q4_K_M` variant is a good quality/size balance for local use.

### What Quantization Costs

Quantization losses are not uniform:
- **Factual recall** — usually preserved well at INT8, degrades at INT4
- **Complex reasoning** — most sensitive to quantization; INT4 models can miss multi-step logic that FP16 handles
- **Instruction following** — generally preserved well down to Q4/AWQ
- **Code generation** — degraded at aggressive quantization (Q3 and below)

The practical floor for quality-sensitive production use is AWQ INT4 or GPTQ INT4. Below that (Q3, Q2), you're trading significant capability for VRAM savings.

## Practical Implications

**Running Llama 4 Scout (17B×16E MoE) locally:**

| Quantization | Active param VRAM | Fits on |
|---|---|---|
| BF16 | ~34 GB | A100 80GB (tight) |
| INT8 | ~17 GB | RTX 4090 24GB (partial layers to CPU) |
| Q4_K_M | ~10 GB | RTX 3080 / Mac M2 16GB |

**Running DeepSeek-R1 671B (MoE, 37B active):**

| Quantization | VRAM needed | Fits on |
|---|---|---|
| FP16 weights | ~1.3 TB total | Not feasible single-node |
| INT8 weights | ~680 GB | ~8× A100 80GB |
| Q4 weights | ~340 GB | ~4–5× A100 80GB |
| Q2_K (lossy) | ~170 GB | ~2–3× A100 80GB |

For large MoE models, the relevant memory is for the active parameters — but you still need to store all weights.

## Production Reality

**INT8 is usually the right trade-off** — near-FP16 quality with half the VRAM. Most production deployments use W8A16 (8-bit weights, 16-bit activations). INT4 is for VRAM-constrained environments where quality compromise is acceptable.

**Benchmark on your task, not benchmarks** — published accuracy numbers are averages across diverse tasks. Your specific use case may be more or less sensitive to quantization. Always evaluate against your own eval set.

**KV cache is often the binding constraint** — for long-context use cases, quantizing the KV cache (INT8 or INT4 KV) can unlock more headroom than quantizing weights. Tools like vLLM support `--kv-cache-dtype fp8` for this.

**Cloud providers handle this for you** — managed API providers run their own optimized quantized models. The Sonnet 4.6 and GPT-5.5 you call via API are not running in FP32. This is a self-hosting concern.
