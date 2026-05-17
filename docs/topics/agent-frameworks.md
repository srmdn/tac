# Agent Frameworks

_Last updated: May 17, 2026_

Libraries and platforms that handle the agent loop so you don't have to. They give you tool definition, execution, state management, and multi-agent coordination — at the cost of an abstraction layer over the raw API.

## The Decision

Before picking a framework, decide what you're actually building:

| You're building… | Consider |
|------------------|---------|
| Production agent on Claude | Anthropic Agent SDK or raw API |
| Complex stateful workflows | LangGraph |
| RAG-heavy document Q&A | LlamaIndex |
| TypeScript/Node.js backend | Mastra |
| Multi-agent team patterns | CrewAI or AutoGen |
| Type-safe, testable Python agents | Pydantic AI |
| Prompt optimization over labeled data | DSPy |
| Production RAG pipeline | Haystack |

The "just use LangChain" default is less correct in 2026 than it was in 2023. The landscape has specialized. Pick the framework that matches your actual problem, not the most popular one.

## Framework Reference

### LangChain / LangGraph

**LangChain** — the original "everything" framework. Chains, tools, memory, retrievers, callbacks.

**LangGraph** — the modern follow-up. Stateful graph of nodes and edges; explicit state machine for agents. A better choice than LangChain for new agent work.

- **What it gives you:** Explicit control flow (nodes + edges), persistent state, human-in-the-loop checkpoints, built-in streaming and debugging via LangSmith
- **Sweet spot:** Production agents that need precise control flow, retry logic, and auditability; complex multi-step workflows
- **Sharp edges:** LangChain has significant API churn history. If you're starting new, use LangGraph and avoid raw LangChain chains. The abstraction can leak — you'll fight the framework on edge cases.

### Anthropic Agent SDK

Lightweight, opinionated SDK for building Claude-based agents. Beta as of 2025; Python-first.

- **What it gives you:** Tool definition via `@beta_tool`, managed agent/session lifecycle, streaming event loop. The `tool_runner` handles the call-respond loop automatically.
- **Sweet spot:** Production agents built on Claude where you want Anthropic-sanctioned patterns without framework overhead
- **Sharp edges:** Claude-only. Intentionally minimal — you own more of the stack. No built-in RAG or vector store primitives.

```python
from anthropic import Anthropic, beta_tool

client = Anthropic()

@beta_tool
def search_docs(query: str) -> str:
    """Search internal documentation."""
    return retriever.search(query)

runner = client.beta.messages.tool_runner(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    tools=[search_docs],
    messages=[{"role": "user", "content": "How do I configure the auth middleware?"}],
)

for message in runner:
    print(message.content)
```

### LlamaIndex

Data framework, not primarily an agent framework.

- **What it gives you:** Connectors, indexes, query engines, retrievers over documents and data sources. Agents built on top.
- **Sweet spot:** [RAG](/topics/embeddings)-heavy applications, document Q&A, knowledge bases, data ingestion into [vector stores](/topics/embeddings)
- **Sharp edges:** Agent capabilities are secondary to retrieval. Less suited for complex multi-agent orchestration or stateful agent loops.

### Pydantic AI

From the Pydantic team. Released late 2024.

- **What it gives you:** Type-safe agents — I/O defined with Pydantic models, dependency injection for tools, multi-provider support (OpenAI, Anthropic, Gemini, Groq, and others)
- **Sweet spot:** Python teams who want type safety, testability, and clean interfaces in production agent code
- **Sharp edges:** Young project; ecosystem thin; multi-agent orchestration is basic. Documentation still maturing.

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class SearchResult(BaseModel):
    answer: str
    confidence: float

agent = Agent("claude-sonnet-4-6", result_type=SearchResult)
result = agent.run_sync("What is the current API rate limit?")
print(result.data.answer, result.data.confidence)
```

### CrewAI

Fast growth in 2024–2025 and continuing.

- **What it gives you:** Role-based multi-agent — Agents with roles/goals/backstories, Tasks, Crews that coordinate them
- **Sweet spot:** Workflows that map naturally to team roles (researcher → writer → reviewer pattern); getting non-technical stakeholders to understand agent designs
- **Sharp edges:** The role/crew metaphor breaks down for complex dynamic graphs. Less control over inter-agent communication than LangGraph. Can feel like prompt engineering with extra ceremony.

### AutoGen (Microsoft)

Version 0.4 (released late 2024) is a significant rewrite of v0.2 with breaking API changes.

- **What it gives you:** Conversational multi-agent — agents communicate via message passing; both low-level (AutoGen Core) and high-level (AgentChat) interfaces
- **Sweet spot:** Multi-agent debate and collaboration patterns, code execution agents, research automation
- **Sharp edges:** v0.2 → v0.4 migration is painful. Documentation fragmented across versions. Async-first design in v0.4 has a steeper learning curve. Some Microsoft-specific integration assumptions.

### DSPy

From Stanford NLP.

- **What it gives you:** A programming model — instead of writing prompts, you define modules with input/output signatures and use optimizers to auto-tune prompts and few-shot examples against your labeled data
- **Sweet spot:** Tasks where you have evaluation data and want to systematically optimize prompts; production pipelines where manual prompt engineering is expensive
- **Sharp edges:** Requires labeled data to be useful. Not a general agent orchestration framework. Steep conceptual learning curve. Slow optimization runs. Less suited for open-ended agentic tasks.

### Haystack

From deepset.

- **What it gives you:** Pipeline-based components (retrievers, generators, routers) connected in a DAG. Strong production focus and testing primitives.
- **Sweet spot:** Production [RAG](/topics/embeddings) systems, document processing, enterprise search
- **Sharp edges:** Agent capabilities are add-ons, not first-class. Less community momentum than LangChain for raw mindshare.

### Mastra

TypeScript-first. Released 2024.

- **What it gives you:** Workflows (durable, step-based), agents with memory and tools, [RAG](/topics/embeddings) primitives, integrations catalog — all in TypeScript
- **Sweet spot:** TypeScript/Node.js backend teams; Next.js full-stack apps; teams wanting type-safe agents without Python
- **Sharp edges:** Younger than Python competitors. Smaller ecosystem. Less battle-tested at scale.

## MCP: Model Context Protocol

A protocol, not a framework. Anthropic introduced MCP in November 2024. As of May 2026, MCP is becoming the default interoperability layer for tools and external context across the agent ecosystem, but support still varies by client, framework, and feature surface.

> Current as of May 2026. Verify specific MCP client support before committing to a framework or product architecture.

**What it defines:**
- **Tools** — functions the LLM can call
- **Resources** — data the LLM can read
- **Prompts** — reusable prompt templates

**How it works:** An MCP server (a process or HTTP endpoint) exposes these capabilities. An MCP client (your agent, Claude Desktop, VS Code Copilot, etc.) connects to it and presents the tools to the model.

**Adoption as of May 2026:**
- Claude and the OpenAI Agents SDK have first-party MCP stories
- ChatGPT developer mode and custom connectors are rolling out MCP support in beta
- IDE and agent clients such as VS Code Agent mode and Cursor have visible MCP support
- Framework support is uneven: some expose MCP adapters directly, others rely on community integrations

**Why it matters:** Before MCP, every agent framework had its own tool format. MCP lowers tool-integration switching cost and makes it more realistic to reuse the same tool surface across editors, agent frameworks, and hosted clients. The ecosystem is converging, but not yet fully interoperable.

**Sharp edges:** The spec is still evolving. Authentication, approvals, remote transport security, and extension support vary by client. "Supports MCP" often means only a subset of the protocol or a specific transport.

## Building Without a Framework

For many production use cases, the overhead of a framework isn't worth it. A raw agent loop is ~30 lines of code:

```python
messages = [{"role": "user", "content": initial_prompt}]

for _ in range(max_steps):
    response = client.messages.create(
        model="claude-sonnet-4-6",
        tools=tool_definitions,
        messages=messages,
    )

    if response.stop_reason == "end_turn":
        break

    # Execute tool calls
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})
```

No framework needed. You own the loop, you understand every line, and there's nothing to fight when you need custom behavior.

## Production Reality

**Framework abstractions leak** — every framework that wraps the raw API eventually exposes its seams. When you need to do something non-standard (custom retry logic, specific token budget management, unusual tool call patterns), you're either fighting the framework or dropping to the raw API anyway.

**LangChain's API churn was real** — code written against LangChain 0.1 often doesn't run on 0.3. If you're committing a team to a framework for a production product, factor in upgrade costs. LangGraph is more stable and is the right choice from the LangChain ecosystem.

**Small agents don't need big frameworks** — if your "agent" calls 2–3 tools and returns an answer, a framework adds more complexity than it removes. Reach for frameworks when you genuinely need the features: stateful loops, multi-agent coordination, persistence, human-in-the-loop.

**Test without the framework abstraction** — write unit tests that call the raw API directly, not just through your framework adapter. Frameworks can mask model behavior changes that your tests would otherwise catch.
