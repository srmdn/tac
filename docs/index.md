---
layout: home

hero:
  name: Tac
  text: The Agent Stack
  tagline: A technical reference for Agentic AI. Learn how the stack fits together, or jump straight to the production problem you're solving.
  actions:
    - theme: brand
      text: Learning the stack
      link: /stack/
    - theme: alt
      text: I'm building something
      link: /topics/tokens-and-cost

features:
  - title: New to the stack
    details: Work up from foundation models to agent applications. Each layer builds on the one below. For engineers who want to understand how everything fits together before they build.
    link: /stack/
    linkText: Start at the foundation
  - title: Already building
    details: Jump to the decision you're facing right now. Cost control, context limits, tool design, rate limits — each topic is framed around a production problem, not a definition.
    link: /topics/tokens-and-cost
    linkText: Browse by problem
---

## Topics by Problem

Each topic answers a decision a builder actually faces.

| You're dealing with… | Topic |
|----------------------|-------|
| Unpredictable LLM costs | [Tokens & Cost](/topics/tokens-and-cost) |
| Agent breaking at long context | [Context Windows](/topics/context-windows) |
| Wanting to cut input costs significantly | [Prompt Caching](/topics/prompt-caching) |
| Inconsistent or unreliable outputs | [Sampling](/topics/sampling) |
| Response time too slow | [Latency](/topics/latency) |
| Rate limits hitting in production | [Rate Limits & Concurrency](/topics/rate-limits) |
| Long context eating VRAM | [KV Cache & Quantization](/topics/kv-cache-quantization) |
| Choosing a serving solution | [LLM Serving](/topics/llm-serving) |
| Wondering why MoE models are cheap | [MoE Architecture](/topics/moe-architecture) |
| Picking or building an agent framework | [Agent Frameworks](/topics/agent-frameworks) |
| Single agent not enough | [Orchestration](/topics/orchestration) |
| Agent output quality is unpredictable | [Evaluations](/topics/evals) |
| Agent misbehaving on untrusted content | [Prompt Injection & Security](/topics/prompt-injection) |
| Tools called incorrectly or unreliably | [Tool Use & Function Calling](/topics/tool-use) |
| Agent losing track in long conversations | [Context Management](/topics/context-management) |
| Standard model failing on hard problems | [Reasoning Models](/topics/reasoning-models) |

## The Stack

Four layers. Each has its own economics, failure modes, and decisions. Understanding all four is what separates a demo from a production system.

| Layer | What it provides |
|-------|-----------------|
| Agent Applications | The user-facing layer — coding agents, assistants, support bots |
| Agent Runtime | Frameworks and protocols that turn LLM output into action |
| Agent Infrastructure | Serving, caching, routing — makes inference economical at scale |
| Foundation Models | Transformers, weights, tokenizers — where every constraint originates |
