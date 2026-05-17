# Agent Applications

The user-facing layer of the stack. This is where the engineering choices made in the three layers below become visible — or invisible, when they work. The decisions here are primarily about what you own versus what you buy, and how you maintain quality once users are touching it.

## The Production Decision

Application-layer decisions are build vs buy tradeoffs with compounding cost implications:

- How much of the runtime, infrastructure, and model selection do you control?
- What does quality mean for your use case, and how do you measure it continuously?
- What is your latency budget, and where is the UX cliff?
- What happens when the agent is wrong — and how often will it be?

## Application Categories

### Coding Agents

Autonomous code generation, editing, debugging, and test writing. The highest-productivity application type; also the highest-risk for incorrect output.

Key characteristics:
- Require strong tool use: file read/write, terminal execution, test runner
- Context grows fast — open files, diffs, error traces accumulate quickly
- Output can be verified mechanically (does the code run? do tests pass?)
- Errors are often self-correctable if the agent can see the failure output

Examples: Claude Code, GitHub Copilot Workspace, Cursor, Devin

### Personal AI Assistants

General-purpose agents with memory across sessions, often multimodal. The broadest category; the hardest to evaluate.

Key characteristics:
- Long-term memory is expected — users want the agent to remember prior interactions
- Multi-turn conversation requires careful context management
- Scope is unbounded — users will ask anything
- Quality is subjective and hard to measure at scale

Examples: Claude.ai, ChatGPT, Perplexity, Kimi

### Support and Domain Bots

Agents scoped to a specific knowledge domain — customer support, internal helpdesks, compliance tools. Narrower scope makes evaluation tractable.

Key characteristics:
- Knowledge retrieval is the core capability (RAG)
- Hallucination on factual claims is the primary failure mode
- Escalation paths are required — the agent must know when to hand off to a human
- Latency expectations are tight (users want fast answers)

### Research and Synthesis Agents

Agents that gather information autonomously — browsing, reading documents, compiling reports.

Key characteristics:
- Require browsing and document ingestion tools
- Output quality is hard to verify without domain expertise
- Source attribution matters — users need to trust what they read
- Hallucinated citations are a catastrophic failure mode

## Build vs Buy

The stack layers below can be owned at different depths:

| Layer | Buy | Build when |
|-------|-----|------------|
| Foundation model | Always (start with API) | Never at application scale |
| Inference serving | Use managed API | >10M tokens/day, data residency |
| Prompt caching | Provider handles automatically | Need cross-request cache control |
| Routing | Use a proxy (LiteLLM, PortKey) | Complex business rules, need full auditability |
| Agent framework | LangGraph, CrewAI, or Claude SDK | Simple agent, or framework adds no value |
| Eval harness | Braintrust or Langfuse | Deep integration with internal data pipeline |
| Memory store | pgvector, Qdrant | Existing DB infra, specific schema requirements |

The most common mistake: building infrastructure before you have users. API costs are fixed per token; ops burden is fixed per engineer. Start managed, switch when the numbers force you to.

## Quality at the Application Layer

Evals are the only way to ship confidently. At the application layer, this means:

**Define what "correct" means before building.** For a support bot, is correct "user gets the right answer" or "user does not escalate"? These are different metrics with different instrumentation.

**Sample production traffic for eval.** Synthetic benchmarks measure what you imagined users would ask. Real user queries expose failure modes you did not anticipate.

**Regression test every prompt change.** System prompt edits are code changes. They should go through the same review and eval pipeline as code changes.

**Score at the output level, not the turn level.** An agent that takes five suboptimal steps but produces the right final answer is still a good agent. Optimize for outcomes, not paths.

[Evaluations →](/topics/evals) | [Prompt Injection & Security →](/topics/prompt-injection)

## Latency at the Application Layer

User experience is directly coupled to latency:

| Latency to first token | User perception |
|------------------------|----------------|
| < 500ms | Feels instant |
| 500ms–2s | Acceptable for complex tasks |
| 2s–5s | Noticeable; acceptable only with a loading indicator |
| > 5s | Users abandon or lose trust |

Streaming is required for most agent applications. Even if total generation takes 10 seconds, showing the first tokens within 1 second is the difference between usable and frustrating.

For multi-step agents, show progress — "Searching documentation...", "Writing tests..." — so users understand why it takes longer than a single model call.

[Latency →](/topics/latency)

## Production Reality

**The demo-to-product gap is the eval gap.** A demo works because you test it. A product breaks because users do things you did not test. The delta is almost always insufficient eval coverage on real user inputs. Ship evals before you ship features.

**Safety and misuse surface at scale.** Ten users in beta will not find your prompt injection vulnerability. Ten thousand users will. Red-team your application before launch, not after an incident. [Prompt Injection & Security →](/topics/prompt-injection)

**Latency expectations are set by the first experience.** If your agent takes 8 seconds on the first run, users will accept 8 seconds next time. If it takes 1 second once, they will lose patience at 3 seconds. First-run performance shapes the perception of all subsequent runs.

**Agentic actions compound errors.** A single-turn LLM that is wrong 5% of the time is usually acceptable. An agent that makes 10 sequential decisions with a 5% error rate per step fails the full task ~40% of the time. Plan for graceful failure, human escalation, and undo paths from the start.

**Users do not read the limitations.** No matter what you write in the documentation, users will ask your coding agent about their health, ask your support bot for legal advice, and ask your research agent to write their thesis. Design for the gap between intended use and actual use.

## Related Topics

- [Evaluations](/topics/evals) — for measuring application quality on real user tasks
- [Latency](/topics/latency) — for the UX cliff users feel before they read any output
- [Autonomous Agent Systems](/topics/autonomous-agents) — for packaged products you run instead of building from scratch
- [Prompt Injection & Security](/topics/prompt-injection) — for application-layer safety boundaries
