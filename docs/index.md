---
layout: home

hero:
  name: Tac
  text: The Agent Stack
  tagline: A technical reference for Agentic AI. Learn how the stack fits together, or jump straight to the production problem you're solving.
  actions:
    - theme: brand
      text: Start with the stack
      link: /stack/
    - theme: alt
      text: Browse decisions
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

### Models and Economics

| You're dealing with… | Topic |
|----------------------|-------|
| Choosing a model family or provider | [Foundation Models](/stack/foundation-models) |
| Unpredictable LLM costs | [Tokens & Cost](/topics/tokens-and-cost) |
| Standard model failing on hard problems | [Reasoning Models](/topics/reasoning-models) |
| Need to choose between RAG and fine-tuning | [Fine-Tuning](/topics/fine-tuning) |
| Need a smaller model to mimic a larger one | [Fine-Tuning](/topics/fine-tuning) |

### Serving and Performance

| You're dealing with… | Topic |
|----------------------|-------|
| Agent breaking at long context | [Context Windows](/topics/context-windows) |
| Deciding between managed APIs and self-hosting | [LLM Serving](/topics/llm-serving) |
| Wanting to cut input costs significantly | [Prompt Caching](/topics/prompt-caching) |
| Inconsistent or unreliable outputs | [Sampling](/topics/sampling) |
| Response time too slow | [Latency](/topics/latency) |
| Rate limits hitting in production | [Rate Limits & Concurrency](/topics/rate-limits) |
| Long context eating VRAM | [KV Cache & Quantization](/topics/kv-cache-quantization) |
| Retrieval quality worse than expected | [Embeddings & Vector Stores](/topics/embeddings) |
| Wondering why MoE models are cheap | [MoE Architecture](/topics/moe-architecture) |

### Agents and Workflow

| You're dealing with… | Topic |
|----------------------|-------|
| Picking or building an agent framework | [Agent Frameworks](/topics/agent-frameworks) |
| Deploying a ready-made autonomous agent | [Autonomous Agent Systems](/topics/autonomous-agents) |
| Single agent not enough | [Orchestration](/topics/orchestration) |
| Tools called incorrectly or unreliably | [Tool Use & Function Calling](/topics/tool-use) |
| Agent losing track in long conversations | [Context Management](/topics/context-management) |

### Quality and Safety

| You're dealing with… | Topic |
|----------------------|-------|
| Agent output quality is unpredictable | [Evaluations](/topics/evals) |
| Agent misbehaving on untrusted content | [Prompt Injection & Security](/topics/prompt-injection) |

If you prefer layer-first navigation, start at [The Stack](/stack/). If you want project scope and editorial intent, see [About](/about).
