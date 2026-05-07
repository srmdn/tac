# Agent Frameworks

The tools that turn LLMs into agents.

## What is an Agent Framework?

A library or platform that provides:

- **Tool definition** — Register functions the LLM can call.
- **Execution loop** — Run the LLM, parse tool calls, execute, feed back results.
- **Memory** — Store and retrieve conversation history and knowledge.
- **Planning** — Break goals into subtasks.

## Major Frameworks

| Framework | Type | Key Feature |
|-----------|------|-------------|
| **Hermes Agent** | Multi-platform orchestration | Event-driven, skill-based, multi-agent |
| **OpenClaw** | Coding agent | Terminal-native, file-aware, git-integrated |
| **Claude Code** | IDE-integrated coding | Deep IDE integration, project-wide context |
| **LangChain** | General-purpose | Broad integrations, rapid prototyping |
| **AutoGPT** | Autonomous agent | Self-directed goal pursuit |
| **MCP** | Protocol (not framework) | Standardized tool discovery |

## MCP: Model Context Protocol

A protocol, not a framework. Defines how agents discover and use tools across systems. Key concepts:

- **Servers** — Expose tools, resources, and prompts.
- **Clients** — Connect to servers and use their capabilities.
- **Tools** — Functions the LLM can call.
- **Resources** — Data the LLM can read.

MCP is gaining traction as the "USB-C for AI tools" — one standard, many implementations.

## Choosing a Framework

| Need | Recommendation |
|------|----------------|
| Coding agent | Claude Code, OpenClaw |
| Multi-agent system | Hermes Agent |
| Rapid prototyping | LangChain |
| Production reliability | Custom loop + MCP |
