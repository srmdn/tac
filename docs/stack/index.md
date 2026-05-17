# The Stack

Agentic AI is not a single technology. It is four layers, each with its own economics, failure modes, and engineering decisions. The gap between a demo and a production system is almost always a gap in one of these layers — not the model.

## Four Layers

### 1. Foundation Models

Transformers, weights, tokenizers, and sampling parameters. Context windows, KV caches, and token pricing originate here. Every constraint above is a consequence of a decision made at this layer.

The key production decisions: which model family, what context window, managed or self-hosted, what quantization tier.

[Foundation Models →](/stack/foundation-models)

### 2. Agent Infrastructure

The systems that make inference economical at scale: serving platforms, prompt caching, model routing, and observability. Without this layer, agents are too slow and too expensive to run at real volume.

The key production decisions: managed API vs self-hosted, when to cache, how to route, what to instrument.

[Agent Infrastructure →](/stack/infrastructure)

### 3. Agent Runtime

The frameworks and protocols that turn LLM outputs into action: tool loops, function calling, MCP, memory, and planning patterns. This is where a chatbot becomes an agent — and where most reliability failures happen.

The key production decisions: framework vs raw loop, tool design, memory architecture, failure handling.

[Agent Runtime →](/stack/agent-runtime)

### 4. Agent Applications

The user-facing layer: coding agents, assistants, support bots, research agents. The visible part of the iceberg, built on everything below. The decisions here are primarily about what you own versus what you buy, and how you maintain quality once users are in the loop.

The key production decisions: build vs buy across layers, eval strategy, latency budget, safety boundaries.

[Agent Applications →](/stack/applications)

## Browse by Problem

If you already know the production issue, jump straight to the topic:

- Cost pressure → [Tokens & Cost](/topics/tokens-and-cost), [Prompt Caching](/topics/prompt-caching)
- Long context failures → [Context Windows](/topics/context-windows), [Context Management](/topics/context-management)
- Serving and latency tradeoffs → [LLM Serving](/topics/llm-serving), [Latency](/topics/latency), [Rate Limits & Concurrency](/topics/rate-limits)
- Agent reliability → [Tool Use & Function Calling](/topics/tool-use), [Agent Frameworks](/topics/agent-frameworks), [Evaluations](/topics/evals)
- Safety boundaries → [Prompt Injection & Security](/topics/prompt-injection)
