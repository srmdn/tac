# LLM Serving

Turning a model into an API endpoint.

## Deployment Options

### Managed APIs

- **OpenAI API** — GPT-4, GPT-4o, o1, o3
- **Anthropic API** — Claude 3.5, Claude 4
- **DeepSeek API** — DeepSeek-V3, R1
- **Moonshot API** — Kimi K2

Pros: No infrastructure. Cons: Vendor lock-in, rate limits, cost at scale.

### Self-Hosted

- **vLLM** — High-throughput serving with PagedAttention.
- **llama.cpp** — Edge deployment, GGUF quantization.
- **TGI (Text Generation Inference)** — HuggingFace production server.
- **SGLang** — Structured generation optimized.

Pros: Control, privacy, cost optimization. Cons: Infrastructure burden.

### Hybrid

Route requests between managed and self-hosted based on latency, cost, or data sensitivity.

## Key Metrics

- **Throughput** — Tokens per second across all requests.
- **Latency** — Time to first token (TTFT) and time per output token (TPOT).
- **Utilization** — GPU/VRAM usage. Idle GPUs are expensive GPUs.

[Latency →](/topics/latency)
