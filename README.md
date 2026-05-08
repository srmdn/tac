# tac

> **The Agent Stack** — a technical reference for Agentic AI.

**[srmdn.github.io/tac](https://srmdn.github.io/tac/)**

---

## What is this?

**tac** is a structured reference that maps the full Agentic AI stack — from token economics and quantization up to multi-agent orchestration and production evals.

It is not a tutorial. It is a reference for builders: production decision framing at the top of every page, technical depth throughout, and a "Production Reality" section on each topic with real gotchas.

## The Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Applications   ← coding agents, assistants, support  │
├─────────────────────────────────────────────────────────────┤
│  Agent Runtime        ← tool loops, MCP, memory, planning   │
├─────────────────────────────────────────────────────────────┤
│  Agent Infrastructure ← serving, caching, routing, observ.  │
├─────────────────────────────────────────────────────────────┤
│  Foundation Models    ← transformers, tokenizers, weights   │
└─────────────────────────────────────────────────────────────┘
```

## Topics

**Foundations**
- **Tokens & Cost** — pricing tables (6 providers), language ratios, cost math
- **Context Windows** — model sizes, lost-in-the-middle, RAG vs large-context
- **Sampling** — temperature/top-p mechanics, structured output APIs, temp=0 non-determinism

**Infrastructure**
- **LLM Serving** — vLLM, SGLang, TGI, TensorRT-LLM, managed vs self-hosted
- **Prompt Caching** — Anthropic/OpenAI/Google/DeepSeek breakdown, break-even math
- **Latency** — TTFT/TPOT, latency budget table, streaming, parallelization
- **KV Cache & Quantization** — KV memory math, PagedAttention, GPTQ/AWQ/GGUF
- **Rate Limits & Concurrency** — tier tables, TPM math, backoff/queue/circuit-breaker

**Architecture**
- **MoE Architecture** — router mechanics, self-hosting paradox, load balancing
- **Reasoning Models** — thinking tokens, cost reality, hybrid routing

**Agents**
- **Agent Frameworks** — 2025 landscape (LangGraph, CrewAI, AutoGen), MCP adoption, raw-loop example
- **Orchestration** — 4 patterns with tradeoffs, failure contracts, consensus anti-pattern
- **Tool Use & Function Calling** — mechanics, reliable tool design, argument hallucination
- **Context Management** — sliding window, summarization, RAG, token budgets

**Quality & Safety**
- **Evaluations** — eval types, LLM-as-judge gotchas, harness design, eval drift
- **Prompt Injection & Security** — attack surface, mitigations, system prompt leakage

## Built with

- [VitePress](https://vitepress.dev/) — static site generator
- TypeScript + CSS — theme and config

## Author

**Said Ramadhan** ([@srmdn](https://github.com/srmdn))

## License

MIT
