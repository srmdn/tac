# Agent Runtime

The frameworks and protocols that turn LLM outputs into action.

## What Makes an Agent?

A chatbot responds. An agent acts. The runtime layer provides the scaffolding for action:

- **Tool Use / Function Calling** — The LLM decides to call an external function, the runtime executes it, and the result is fed back.
- **MCP (Model Context Protocol)** — A standardized way for agents to discover and use tools across systems.
- **Memory** — Short-term (conversation history) and long-term (vector databases, knowledge graphs).
- **Planning Loops** — Breaking a goal into subtasks, executing them sequentially or in parallel.

## Major Frameworks

| Framework | Focus | Runtime Style |
|-----------|-------|---------------|
| Hermes Agent | Multi-platform agent orchestration | Event-driven, skill-based |
| OpenClaw | Coding agent | Terminal-native, file-aware |
| Claude Code | IDE-integrated coding | Conversation + file edits |
| MCP | Protocol, not framework | Tool discovery standard |

## The Loop

```
User Goal
    ↓
Planner — breaks into subtasks
    ↓
LLM Call — generates thought + action
    ↓
Tool Execution — runtime runs the tool
    ↓
Observation — result fed back to LLM
    ↓
(Repeat until goal achieved)
```

[Agent Frameworks →](/topics/agent-frameworks)
