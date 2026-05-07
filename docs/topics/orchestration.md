# Orchestration

Multi-agent systems and workflows.

## Beyond Single Agents

A single agent can handle simple tasks. Complex workflows require multiple agents working together:

- **Researcher** — gathers information
- **Writer** — drafts content
- **Editor** — reviews and refines
- **Fact-checker** — verifies claims

## Patterns

### Sequential

Agents execute in order. Output of agent A is input to agent B. Simple, predictable.

### Parallel

Agents execute simultaneously. Results are merged. Faster, but requires conflict resolution.

### Hierarchical

A supervisor agent delegates to worker agents. Workers report back; supervisor coordinates.

### Graph-based

Agents are nodes in a graph. Edges define flow. Supports loops, branching, and conditional logic.

## Routing

Not every task needs the strongest (and most expensive) model. Routing sends each task to the right agent:

- Simple query → cheap local model
- Code review → Claude
- Creative writing → GPT-4o
- Math problem → reasoning model (o1, R1)

## Failure Modes

- **Cascading errors** — One agent fails, others fail in sequence.
- **Consensus deadlock** — Agents disagree and loop forever.
- **Context pollution** — One agent's output poisons another's context.

Mitigation: timeouts, retry limits, human-in-the-loop checkpoints.

:::tip
Start with a single agent. Add orchestration only when you have a measurable problem that multi-agent solves.
:::
