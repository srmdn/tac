# tac

> **The Agent Stack** — a technical compendium for Agentic AI.

---

## What is this?

**tac** is a structured knowledge base that maps the full stack of Agentic AI — from the lowest-level token economics up to multi-agent orchestration.

It is not a tutorial. It is a **reference** for builders who want to understand how the pieces fit together: what a context window actually is, how prompt caching saves money, why model routing matters, and what separates a coding agent from a personal AI assistant.

## The Stack

```
┌──────────────────────────────────────────┐
│  Agent Applications          │  ← coding agents, personal AI, support bots
├──────────────────────────────────────────┤
│  Agent Runtime               │  ← Hermes Agent, OpenClaw, MCP, function calling
├──────────────────────────────────────────┤
│  Agent Infrastructure        │  ← model serving, caching, routing, observability
├──────────────────────────────────────────┤
│  Foundation Models             │  ← DeepSeek, GPT, Claude, Kimi, LLaMA
└──────────────────────────────────────────┘
```

## Topics covered

- **Tokens & Cost** — input, output, pricing models
- **Context Windows** — what they are, how they fill, what happens when they overflow
- **Prompt Caching** — Cache Read, Cache Write, efficiency metrics
- **LLM Serving** — providers, endpoints, model routing
- **Sampling** — temperature, top-p, top-k, structured output
- **Latency** — TTFT, TPOT, streaming vs batch
- **KV Cache & Quantization** — why big context costs VRAM
- **MoE Architecture** — why DeepSeek can be 671B total but 37B active
- **Agent Frameworks** — Hermes Agent, OpenClaw, Claude Code, MCP
- **Orchestration** — multi-agent routing, delegation, workflows
- **Rate Limits & Concurrency** — RPM, TPM, production realities

## Built with

- [VitePress](https://vitepress.dev/) — static site generator
- Markdown — all content is plain text

## Related

- [rig](https://github.com/srmdn/rig) — community wiki for OpenCode & oMO (same stack, different scope)
- [oh-my-openagent](https://gist.github.com/srmdn/448d142a122208c47e586a0d78323b3e) — configuration layer and skill ecosystem
- [landkit](https://github.com/srmdn/landkit) — landing page template collection

## Author

**Said Ramadhan** ([@srmdn](https://github.com/srmdn)) — sysadmin, blogger, builder.

## License

MIT
