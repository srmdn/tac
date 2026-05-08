# LLM Serving

How to turn a model into a reliable API endpoint. The right choice depends on whether you need control, cost optimization, data privacy, or just the fastest path to production.

## The Decision

| Situation | Recommendation |
|-----------|---------------|
| Fastest path to production | Managed API (OpenAI, Anthropic, Google) |
| Cost optimization at high volume | Self-hosted open models |
| Data residency / privacy requirements | Self-hosted or VPC-deployed managed API |
| Maximum inference speed | Groq (LPU) or Cerebras |
| Broadest open model selection | Together AI or Fireworks AI |
| Local development / no network | Ollama + llama.cpp |

## Managed API Providers

No infrastructure to operate. You pay per token.

### Foundation Model APIs

| Provider | Models | Strength |
|----------|--------|----------|
| Anthropic | Claude Haiku 4.5, Sonnet 4.6, Opus 4 | Best instruction following, long context, tool use |
| OpenAI | GPT-4o, GPT-4o mini, o3, o4-mini | Widest ecosystem, structured output, vision |
| Google | Gemini 2.5 Pro, Gemini 2.5 Flash | Largest context window (1M), multimodal |
| DeepSeek | DeepSeek-V3, DeepSeek-R1 | Cheapest frontier quality, strong coding |
| Mistral | Mistral Large 3, Mistral Small | European provider, competitive pricing |

### Inference-Speed Providers

These run open-source models but optimize for throughput and latency using custom hardware or kernels.

**Groq** — Language Processing Unit (LPU) hardware. 200–800 tokens/second on LLaMA/Gemma/Llama 4 models. The fastest option for latency-sensitive workloads. Limited model selection; no fine-tuned model support.

**Cerebras** — Wafer Scale Engine silicon. ~2,000 tokens/second on supported models. The absolute fastest option. Very limited model catalog; no fine-tuning; capacity-constrained.

**Together AI** — 200+ open-source models, fine-tuning API, dedicated GPU instances. Good for teams needing flexibility across many models or custom fine-tuned variants.

**Fireworks AI** — Custom CUDA kernels (FireAttention). Fastest structured output / JSON mode in the market. Good for production apps relying heavily on function calling and constrained generation.

## Self-Hosted Serving

You run the model on your own GPU infrastructure. Higher operational overhead; lower per-token cost at scale; full control over data.

### Production Server Frameworks

**vLLM** — the production standard for high-throughput serving.
- PagedAttention: near-zero KV cache waste, 2–4× better GPU utilization vs. naïve serving
- OpenAI-compatible REST API (drop-in replacement)
- Tensor parallelism for multi-GPU; speculative decoding; continuous batching
- Best for: GPU clusters, multi-tenant serving, high-concurrency deployments

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --max-model-len 32768
```

**SGLang** — highest throughput for structured generation and shared-prefix workloads.
- RadixAttention: caches and reuses KV for shared prompt prefixes across requests
- Native constrained decoding (JSON schema, regex)
- Best for: RAG systems with fixed retrieval context, few-shot workloads, structured output pipelines

**TGI (Text Generation Inference)** — Hugging Face's production server.
- Deep HuggingFace Hub integration; pull and serve any Hub model
- Continuous batching, tensor parallelism, GPTQ/AWQ support
- Best for: Teams already on HuggingFace ecosystem; fast path from Hub model to API

**TensorRT-LLM** — NVIDIA's maximum-performance serving stack.
- Ahead-of-time TensorRT compilation: maximum GPU utilization
- FP8/INT4 kernels; in-flight batching
- Best for: Enterprise deployments requiring maximum throughput on NVIDIA H100/A100 fleets
- Tradeoff: complex build pipeline; slow iteration; NVIDIA-only

### Local / Edge Serving

**llama.cpp** — runs GGUF-quantized models on CPU, GPU, or Apple Silicon.
- Minimal dependencies, universal hardware support
- Best for: Local development, edge/embedded, research prototyping on consumer hardware
- Tradeoff: lower throughput than CUDA-optimized servers at scale

**Ollama** — wraps llama.cpp with model management and OpenAI-compatible API.
- `ollama pull llama3` / `ollama run llama3` — Docker-like model management
- Best for: Developer local dev, desktop apps, Mac/Linux personal use
- Tradeoff: inherits llama.cpp throughput ceilings; limited multi-user concurrency

**mlx-lm** — Apple's MLX framework for Apple Silicon inference.
- Uses unified memory (CPU+GPU shared); optimized for M-series chips
- Best for: Mac developers running models locally without CUDA

## Key Metrics

**Throughput** — total tokens generated per second across all concurrent requests. The metric that matters for batch workloads and shared-serve efficiency.

**TTFT (Time to First Token)** — delay from request to first output token. The metric that matters for interactive, streaming applications.

**TPOT (Time Per Output Token)** — milliseconds per token after the first. Determines how fast a response streams.

**GPU utilization** — idle GPU is expensive GPU. vLLM's PagedAttention and continuous batching exist specifically to keep utilization high across variable-length requests.

See [Latency](/topics/latency) for the full breakdown.

## Model Context Protocol (MCP)

Not a serving framework — a protocol for connecting models to tools and data sources. An MCP server exposes tools (functions), resources (data), and prompts; an MCP client (your agent or IDE) connects to it.

Introduced by Anthropic in November 2024. By mid-2025, it's the de facto standard for tool integration:
- Supported by: Claude, OpenAI Agents SDK, Gemini tooling, GitHub Copilot, VS Code, Cursor, Zed
- 1,000+ community MCP servers: GitHub, Slack, Postgres, filesystem, browser, and more

For self-hosted serving, you can expose your model as an MCP-compatible server or connect it to MCP tool servers — decoupling model serving from tool integration.

## Build vs. Buy Decision

| Factor | Managed API | Self-hosted |
|--------|------------|-------------|
| Setup time | Hours | Days–weeks |
| Ops burden | None | Significant |
| Cost at 1B tokens/month | Higher | Lower |
| Latency | Provider-dependent | Tunable |
| Data privacy | Depends on provider | Full control |
| Model customization | Fine-tuning API only | Full control |
| Scaling | Automatic | Manual |

The break-even point between managed API and self-hosted depends heavily on GPU costs in your region and your traffic profile. At fewer than ~100M tokens/month, managed APIs are almost always cheaper when you factor in engineering and operations time.

## Production Reality

**Managed APIs have gotten significantly cheaper** — the cost argument for self-hosting has narrowed. DeepSeek-V3 at $0.56/M input is competitive with self-hosting a similarly-capable model when you account for GPU costs, engineering time, and reliability.

**GPU availability is a constraint** — H100s and A100s are still capacity-constrained. Self-hosting planning that assumes on-demand GPU availability will be disappointed.

**Cold start latency on serverless** — if you deploy a self-hosted model on serverless GPU infrastructure (Modal, Replicate, RunPod serverless), the first request after idle triggers a model load. This can be 30–120 seconds. Keep the model warm with periodic requests or use reserved capacity for latency-sensitive workloads.

**Benchmark your serving stack** — published throughput numbers for vLLM, SGLang, and TGI are measured under specific conditions (batch size, sequence length, model size, GPU type) that may not match your workload. Benchmark under your actual traffic shape before choosing a framework.
