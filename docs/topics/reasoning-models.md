# Reasoning Models

Reasoning models spend tokens "thinking" before answering. This trades cost and latency for accuracy on hard multi-step problems. Most tasks don't need them.

## The Decision

Use a reasoning model when your task requires multi-step problem solving that standard models consistently fail at. Don't use them by default — the cost and latency penalty is real.

| Task type | Use reasoning model? |
|-----------|---------------------|
| Complex math, formal proofs | Yes |
| Multi-step code generation / debugging | Often |
| Long-horizon planning with constraints | Often |
| Research synthesis across many sources | Sometimes |
| Simple Q&A, retrieval, summarization | No |
| Classification, extraction | No |
| High-volume, cost-sensitive pipelines | No |

## How They're Different

Standard models generate output token-by-token without a separate planning phase. They can chain reasoning steps via chain-of-thought prompting, but this is learned behavior surfaced in the output — it's not structurally separated.

Reasoning models (o1, o3, DeepSeek-R1, QwQ) include an explicit "scratchpad" phase before producing the final answer. This scratchpad:
- Is billed as tokens (input + output pricing applies)
- May or may not be visible to you depending on the API
- Can run for hundreds to thousands of tokens even on seemingly simple problems

The result is a model that "checks its work" more systematically, at the cost of generating more tokens per request.

## Pricing Reality

Thinking tokens are not free. A reasoning model on a hard problem might generate 5K–30K thinking tokens before responding. At current rates:

| Model | Input | Output | Typical thinking budget |
|-------|-------|--------|------------------------|
| o3 | $10/1M | $40/1M | 10K–30K tokens |
| Claude claude-sonnet-4-6 (extended thinking) | $3/1M | $15/1M | Configurable |
| DeepSeek-R1 | $0.55/1M | $2.19/1M | Variable |

On a task that generates 20K thinking tokens, you pay for 20K output tokens just for the reasoning — before you see the answer.

## Thinking Budget

Most reasoning model APIs let you cap or configure how many tokens the model can spend thinking. This is a cost/quality tradeoff:

- **Low budget** — faster, cheaper, less thorough. May miss edge cases.
- **High budget** — slower, more expensive, more systematic. Worthwhile for problems where errors are costly.

Some APIs (e.g., Claude extended thinking) let you set an explicit `budget_tokens` parameter. Experiment with the minimum budget that achieves acceptable quality — you often don't need the maximum.

## Hybrid Routing

Don't route everything to reasoning models. Route by task difficulty:

```python
def choose_model(task: Task) -> str:
    if task.requires_multi_step_reasoning():
        return "o3"           # hard problems
    elif task.requires_strong_instruction_following():
        return "claude-sonnet-4-6"   # medium complexity
    else:
        return "claude-haiku-4-5"    # high volume, simple
```

Routing even 5–10% of traffic to a reasoning model only when needed is much cheaper than using one for everything.

## Prompting Differences

Reasoning models respond differently to prompting than standard models:

- **Less chain-of-thought scaffolding needed** — "Let's think step by step" is redundant; the model does this internally.
- **More resistant to leading prompts** — they're less susceptible to "obviously the answer is X, right?" because the thinking phase runs before they see your preferred framing.
- **System prompt handling varies** — some reasoning models (particularly o1-series) give less weight to system prompts than standard models. Test this explicitly.
- **Don't over-specify the reasoning process** — telling a reasoning model exactly how to think often degrades performance. Describe the goal and constraints; let it figure out the steps.

## When Standard Models Are Better

Reasoning models are not universally better. Standard models outperform reasoning models on:

- Tasks requiring fast responses (reasoning adds latency)
- High-volume pipelines (cost 5–20x higher per request)
- Tasks where the answer is obvious and thinking just adds noise
- Instruction-following tasks with very specific formatting requirements (some reasoning models are worse here)
- Creative tasks where "correct" reasoning can flatten outputs

If you're benchmarking a reasoning model, compare on your actual task distribution, not on published benchmarks. Benchmark tasks are selected to show reasoning models at their best.

## Production Reality

**Latency is a hard constraint for most user-facing features** — reasoning models add 5–60 seconds to response time depending on thinking budget. This is acceptable for background jobs and async pipelines; it's often not acceptable for interactive use.

**Streaming helps but doesn't solve it** — streaming shows the user something is happening, but the thinking phase typically isn't streamed. The user sees a long pause, then a fast response. Design your UX around this.

**Thinking tokens can exceed your context budget** — on complex problems, the model may want more thinking space than your context window allows. Monitor for truncated thinking in production.

**Extended thinking is not magic** — reasoning models still hallucinate, still make arithmetic errors, still miss things. They're better at hard multi-step problems, not at eliminating errors entirely. Evals are still required.
