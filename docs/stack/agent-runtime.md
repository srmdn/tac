# Agent Runtime

The layer between LLM output and real-world action. The runtime provides the tool loop, memory, planning, and protocol plumbing that turns a model into an agent. The decisions here determine reliability more than model choice does.

## The Production Decision

Framework and runtime decisions are reliability and maintainability tradeoffs:

- Do you need a framework, or is a raw loop sufficient?
- What happens when a tool fails mid-task — retry, skip, or abort?
- How much state needs to persist across turns, and where does it live?
- Are you building a single agent or orchestrating multiple agents?

## The Tool Loop

Every agent runtime is a variation on the same loop:

```
User Goal
    ↓
LLM call — generates thought + tool call (or final answer)
    ↓
[if tool call] Runtime executes the tool
    ↓
Tool result appended to context
    ↓
LLM call again (repeat until final answer or max steps)
```

The critical decisions are in the edges: what happens when the tool errors, when the model hallucinates a tool name, when max steps is reached, or when two tool calls conflict.

[Tool Use & Function Calling →](/topics/tool-use) | [Orchestration →](/topics/orchestration)

## Tool Design

Tool reliability is the single biggest source of agent failures in production:

- **One action per tool.** Tools that do multiple things produce unpredictable results when partially successful.
- **Idempotent where possible.** The model may call the same tool twice. Write tools that survive duplicate calls.
- **Return structured data.** The model must parse the result. JSON with a consistent schema is more reliable than free-text responses.
- **Fail loudly.** An error message with context ("file not found: /tmp/foo.txt") is more useful to the model than a generic exception or silent empty response.
- **Keep the tool list short.** Models perform worse with more than ~20 tools in context. Scope toolsets to the task.

## MCP (Model Context Protocol)

A protocol — not a framework — for standardized tool and resource discovery. Anthropic-developed and now supported across Claude, many agent frameworks, and third-party tool providers.

MCP defines:
- **Tools** — functions an agent can call
- **Resources** — data sources an agent can read
- **Prompts** — reusable prompt templates

**What it solves:** Without MCP, every integration between an agent and an external system is custom plumbing. With MCP, any MCP-compatible agent can use any MCP-compatible tool server without bespoke glue code.

**What it does not solve:** MCP is not a security boundary. A tool server an agent can call can do anything the server is authorized to do. Prompt injection via tool results is a real attack surface. [Prompt Injection & Security →](/topics/prompt-injection)

**Adoption reality (2025):** MCP is widely adopted in Claude tooling and gaining traction in the broader ecosystem (LangChain, Cursor, many IDE tools). It is not yet universal. Self-hosted MCP servers require ops investment. Plan for both MCP and non-MCP tool integrations in any real system.

## Memory

| Type | Where it lives | Scope | Appropriate for |
|------|----------------|-------|-----------------|
| In-context (conversation history) | Model context window | Single session | Short tasks, low turn count |
| Summarized history | LLM-compressed, stored externally | Single session | Long conversations, token budget management |
| Vector DB (semantic retrieval) | External store (Pinecone, Qdrant, pgvector) | Cross-session | Knowledge retrieval, long-term user context |
| Key-value store | Redis, SQLite | Cross-session | Structured facts, user preferences |
| Episodic memory | LLM-processed event log | Cross-session | Agents that need to recall what they did |

Conversation history is the easiest to implement and the most common source of context overflow. Use summarization or truncation before the window fills, not after. [Context Management →](/topics/context-management)

## Frameworks

| Framework | Model | Best for | Watch out for |
|-----------|-------|----------|---------------|
| LangGraph | Stateful graph execution | Complex multi-step agents, branching | Steep learning curve, verbose graph definition |
| CrewAI | Role-based multi-agent | Teams of specialized agents | Role definitions need tuning, coordination overhead |
| AutoGen | Conversational multi-agent | Collaborative problem-solving | Non-deterministic by design, hard to test |
| LlamaIndex Workflows | Event-driven steps | Data pipelines, RAG agents | Primarily document-oriented |
| Claude Code SDK | Subprocess-based coding | Coding agents, file manipulation | Claude-only, not general-purpose |
| Raw loop (no framework) | Direct API calls | Simple agents, full control | You own retry logic, state, error handling |

**Framework vs raw loop:** A framework adds abstractions — state management, graph execution, role coordination. These abstractions also hide failures. A tool error that would surface immediately in a raw loop may be silently swallowed by a framework's retry handler. Start with the simplest thing that works and add framework complexity only when you have a concrete problem it solves.

[Agent Frameworks →](/topics/agent-frameworks)

## Planning Patterns

| Pattern | How it works | Tradeoffs |
|---------|--------------|-----------|
| ReAct | Interleave reasoning and action in a single prompt loop | Simple, works well for linear tasks |
| Plan-then-execute | Generate full plan first, then execute steps | More structured, but plan becomes stale if early steps fail |
| Tree of Thought | Explore multiple reasoning branches, select best | High token cost, useful for complex single decisions |
| Reflection | Agent critiques its own output before finalizing | Catches some errors, adds latency and tokens |
| Multi-agent consensus | Multiple agents produce answers, vote or reconcile | High cost, rarely better than one strong model |

For most production agents, ReAct is the right starting pattern. Add planning structure only when the task genuinely requires it — complexity that is not earned will hurt reliability.

## Production Reality

**Framework abstractions hide failure modes.** When a tool fails inside a framework's retry handler, you may get a degraded answer rather than an error. Instrument tool calls directly, not just the outer agent call.

**Planning loops are non-deterministic by design.** The same input can produce different tool call sequences across runs. This makes testing hard. Build evals that measure outcome quality, not execution path. [Evaluations →](/topics/evals)

**MCP servers are trusted by default.** An agent that connects to an MCP server will execute whatever tools that server exposes. Vet MCP server implementations before connecting agents to them in production. Tool results can contain prompt injection payloads.

**Max steps is not a safety net.** An agent that hits max steps has likely already taken irreversible actions. Design tasks so each step is independently auditable and reversible where possible. Add step-level logging before you need to debug a runaway agent in production.

**Tool hallucination is a real failure mode.** Models will occasionally call tools with fabricated arguments or call tools that do not exist in the current tool list. Validate all tool call arguments at the runtime layer before execution.

## Related Topics

- [Tool Use & Function Calling](/topics/tool-use) — for schemas, validation, and reliable action boundaries
- [Context Management](/topics/context-management) — for keeping runtime state inside token budgets
- [Orchestration](/topics/orchestration) — for when one agent loop is no longer enough
- [Prompt Injection & Security](/topics/prompt-injection) — for securing tool-connected runtimes
