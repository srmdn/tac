# The Stack

Agentic AI is not a single technology. It is a stack of layers, each with its own constraints, economics, and failure modes. Understanding the stack is the difference between building a demo and building a system that works in production.

## Four Layers

### 1. Foundation Models

The base layer: transformers, weights, tokenizers. This is where context windows, KV caches, and sampling parameters live. Every decision here ripples upward.

[Learn more →](/stack/foundation-models)

### 2. Agent Infrastructure

The systems that make inference economical at scale: serving platforms, prompt caching, model routing, observability. Without this layer, agents are too slow and too expensive to deploy.

[Learn more →](/stack/infrastructure)

### 3. Agent Runtime

The frameworks and protocols that turn LLM outputs into action: function calling, MCP, memory, planning loops. This is where "agent" becomes more than a chatbot.

[Learn more →](/stack/agent-runtime)

### 4. Agent Applications

The user-facing layer: coding agents, personal AI assistants, support bots. The visible part of the iceberg, built on everything below.

[Learn more →](/stack/applications)
