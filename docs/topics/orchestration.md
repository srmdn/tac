# Orchestration

Coordinating multiple agents or LLM calls to complete tasks that a single agent can't do well alone. The complexity cost is real — add orchestration only when you've hit a measurable limit with a single agent.

## The Decision

Start with a single agent. Add orchestration when you can identify a specific, measurable problem it solves:

| Problem | Orchestration pattern |
|---------|----------------------|
| Context window too small for the full task | Sequential decomposition |
| Independent subtasks that could run in parallel | Parallel fan-out |
| Different subtasks need different models/tools | Specialist routing |
| Quality improves with a second pass | Critic/verifier loop |
| Task requires human decisions mid-way | Human-in-the-loop checkpoint |

"It might be better with multiple agents" is not a reason to add orchestration. Premature orchestration adds complexity without benefit.

## Core Patterns

### Sequential Pipeline

Agents execute in order. Each agent's output is the next agent's input. Simple, predictable, debuggable.

```
Input → [Research] → [Draft] → [Edit] → [Format] → Output
```

Use when: stages have clear dependencies and can't proceed without the previous step's output.

Tradeoff: errors compound downstream. If the Research agent hallucinates, every subsequent agent works with bad data. Add validation checkpoints between stages for high-stakes pipelines.

### Parallel Fan-Out

Multiple agents run simultaneously on independent subtasks; results are merged.

```
                 ┌→ [Agent A: subtask 1] →┐
Input → [Split] ─┼→ [Agent B: subtask 2] →┼→ [Merge] → Output
                 └→ [Agent C: subtask 3] →┘
```

Use when: subtasks are genuinely independent (no dependencies between them).

Tradeoff: you need a merge step that handles partial failures. If Agent B fails, do you re-run just B, discard the run, or continue with what A and C returned?

### Hierarchical (Supervisor/Worker)

A supervisor agent breaks down the goal, delegates subtasks to specialist workers, and synthesizes results.

```
User Goal
    ↓
[Supervisor] — plans, delegates, synthesizes
    ├→ [Worker: Code]
    ├→ [Worker: Search]
    └→ [Worker: Write]
```

Use when: the task decomposition itself is complex, or workers have very different capabilities (different models, tools, or permissions).

Tradeoff: the supervisor is a single point of failure. If it decomposes the task poorly, everything downstream fails. Supervisor quality determines system quality.

### Graph / Stateful Loop

Agents are nodes in a directed graph. Edges can be conditional. Supports loops (retry, reflection, iteration) and branching.

```
[Plan] → [Execute] → [Validate]
              ↑            |
              └────────────┘  (loop on failure)
              
              ↓ (on success)
          [Respond]
```

Use when: the workflow has decision points, retry logic, or iterative refinement. LangGraph is designed for this pattern.

Tradeoff: the most powerful pattern is also the hardest to debug. Loops can run indefinitely. State management gets complex. Require explicit exit conditions and maximum iteration counts.

## Inter-Agent Communication

### Shared Context

Agents pass state by appending to a shared context object. Simple, but context grows large and all agents see everything (including each other's errors and reasoning).

### Message Passing

Agents communicate via explicit messages with defined schemas. Cleaner separation, easier to inspect and debug. AutoGen and LangGraph use this pattern.

### Blackboard

Agents read and write to a shared data store (a "blackboard"). Good for workflows where agents need selective access to shared state, not the full conversation history.

## Model Routing

Different subtasks often don't need the same model. Routing reduces cost significantly.

```python
def route(task: Task) -> str:
    if task.type == "code_generation":
        return "claude-sonnet-4-6"
    elif task.type == "classification":
        return "claude-haiku-4-5"
    elif task.type == "math_reasoning":
        return "deepseek-r1"
    else:
        return "gpt-4o-mini"
```

A well-routed 10-agent system can cost the same as 2–3 calls to a frontier model, since most subtasks only need lighter-weight models.

## Failure Handling

Multi-agent failures are qualitatively different from single-agent failures. In a single agent, one failure is a failed request. In orchestrated systems, one failure can cascade.

**Explicit failure contracts** — each agent should return structured success/failure responses, not just text. Downstream agents need to know when upstream agents failed.

**Timeouts at every step** — an agent that hangs indefinitely blocks the entire pipeline. Set per-agent timeouts and handle them explicitly.

**Partial success strategy** — define in advance what happens if 3 of 5 parallel agents succeed. Propagate partial results, or require all to succeed?

**Retry budgets** — allow retries, but cap them. An agent in a reflection loop that never converges should fail after N iterations, not run forever.

**Human-in-the-loop checkpoints** — for irreversible actions (sending emails, executing code in production, making API calls with side effects), pause for human confirmation. Don't let the orchestrator autonomously complete high-stakes chains without oversight.

## Evaluation in Multi-Agent Systems

Single-agent evals measure output quality. Multi-agent evals must also measure coordination:

- **End-to-end task completion rate** — does the pipeline produce correct final output?
- **Latency per pipeline stage** — where is time spent?
- **Error propagation rate** — when one agent fails, how often does the whole pipeline fail?
- **Routing accuracy** — are tasks going to the right agents?

Instrument each agent's inputs/outputs independently. Debugging a multi-agent failure without per-agent traces is nearly impossible.

## Production Reality

**Single-agent with good tools beats multi-agent 80% of the time** — most "multi-agent" use cases in the wild are single-agent use cases with poor tooling. Before adding a second agent, ask: would better tool definitions or a more capable model solve this?

**Latency multiplies** — every agent hop adds latency. A 4-stage sequential pipeline at 2s per stage is 8s minimum. Model that into your product design before committing to the architecture.

**Debugging is exponentially harder** — a bug in a multi-agent system might be in the task decomposition, the inter-agent communication, a specific worker agent, or the merge logic. Invest in tracing before you invest in agents. Use frameworks like LangSmith or build structured logging into every agent call.

**Consensus patterns often fail** — "multi-agent debate where agents vote on the best answer" sounds appealing but rarely works well in practice. Agents trained on similar data will agree on wrong answers; adding more agents just amplifies the dominant error. For verification tasks, use deterministic checks or human review, not agent consensus.
