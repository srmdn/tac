---
layout: home

hero:
  name: Tac
  text: The Agent Stack
  tagline: Technical compendium for Agentic AI. From token economics to multi-agent orchestration.
  image:
    src: /tac-icon.svg
    alt: Tac
  actions:
    - theme: brand
      text: Explore the Stack
      link: /stack/
    - theme: alt
      text: Browse Topics
      link: /topics/tokens-and-cost

features:
  - title: Foundations
    details: Tokens, context windows, sampling. Understand the primitives that power every LLM call.
    link: /topics/tokens-and-cost
  - title: Infrastructure
    details: Serving, caching, latency, quantization. The systems that make inference economical at scale.
    link: /topics/llm-serving
  - title: Agents
    details: Frameworks, runtimes, orchestration. How single agents become compound systems.
    link: /topics/agent-frameworks
---

## What is Tac?

**Tac** is a structured knowledge base that maps the full stack of Agentic AI, from the lowest-level token economics up to multi-agent orchestration.

It is not a tutorial. It is a **reference** for builders who want to understand how the pieces fit together: what a context window actually is, how prompt caching saves money, why model routing matters, and what separates a coding agent from a personal AI assistant.

## The Stack

```
┌─────────────────────────────────────────────────┐
│  Agent Applications            │  ← coding agents, personal AI, support bots
├─────────────────────────────────────────────────┤
│  Agent Runtime                 │  ← Hermes Agent, OpenClaw, MCP, function calling
├─────────────────────────────────────────────────┤
│  Agent Infrastructure          │  ← model serving, caching, routing, observability
├─────────────────────────────────────────────────┤
│  Foundation Models               │  ← DeepSeek, GPT, Claude, Kimi, LLaMA
└─────────────────────────────────────────────────┘
```

## Topics

| Category | Topics |
|----------|--------|
| **Foundations** | [Tokens & Cost](/topics/tokens-and-cost), [Context Windows](/topics/context-windows), [Sampling](/topics/sampling) |
| **Infrastructure** | [LLM Serving](/topics/llm-serving), [Prompt Caching](/topics/prompt-caching), [Latency](/topics/latency), [KV Cache & Quantization](/topics/kv-cache-quantization), [Rate Limits](/topics/rate-limits) |
| **Architecture** | [MoE](/topics/moe-architecture) |
| **Agents** | [Frameworks](/topics/agent-frameworks), [Orchestration](/topics/orchestration) |
