# Evaluations

Without evals, you don't know if your agent is improving or regressing when you change a prompt, swap a model, or add a tool.

## The Decision

Add evals before you tune, not after. If you can't measure quality today, every prompt change is a guess. The question isn't whether to have evals — it's which type you need for your current stage.

| Stage | Minimum eval bar |
|-------|-----------------|
| Prototype | 20-50 hand-written examples, pass/fail by eye |
| Pre-ship | Automated evals covering your known failure modes |
| Production | Continuous regression suite + sampling of live traffic |

## Types of Evals

**Deterministic evals** — exact string match, JSON schema validation, regex. Fast, cheap, no hallucination risk. Use for structured outputs: does the model return valid JSON? Did it call the right tool?

**Model-graded evals** — a second LLM judges the output. Use for open-ended quality: is the answer factually correct? Is the tone appropriate? Cheap enough to run on every change; not perfectly reliable.

**Human evals** — a person scores outputs. The ground truth for anything that matters. Expensive and slow. Reserve for calibrating your model-graded evals, not for CI.

**Task-completion evals** — run the full agent loop against a scenario and check whether the end state is correct. Slowest, most realistic. Run nightly, not on every commit.

## What to Measure

Pick metrics that reflect what actually matters in production:

- **Exact match rate** — for extraction, classification, structured output
- **Tool call accuracy** — did the model call the right tool with valid arguments?
- **Task completion rate** — end-to-end success over a scenario set
- **Faithfulness** — is the answer grounded in the provided context (no hallucination)?
- **Instruction following** — did the model respect constraints (format, length, refusals)?

Avoid generic scores like "helpfulness 1-5." They don't tell you what broke.

## Building an Eval Harness

Minimum viable setup:

```python
# Run a prompt against a model, compare to expected
def run_eval(case: EvalCase) -> EvalResult:
    response = model.complete(case.prompt)
    passed = case.check(response)
    return EvalResult(case_id=case.id, passed=passed, output=response)
```

Practical decisions:

- **Store inputs and expected outputs in a file**, not in test code. They change more often than the harness.
- **Version your eval set** alongside your prompts. A prompt change that improves one eval while silently breaking another is a regression.
- **Track pass rate over time**, not just the latest run. Flakiness in model-graded evals is real — a single failed run is noise, a 5% drop over a week is signal.

## LLM-as-Judge Gotchas

When using a model to grade outputs, the judge inherits the base model's biases:

- Length bias — longer answers tend to score higher
- Self-preference — a model often prefers its own outputs when judging
- Position bias — in pairwise comparisons, the first option wins more often

Mitigations: use a different, stronger model as the judge; randomize order in pairwise comparisons; define a rubric, not a vibe.

## Production Reality

**Eval drift** — your eval set reflects edge cases you hit during development. Production traffic will find new ones. Sample 1-5% of live outputs and periodically add failures to the eval set.

**Prompt changes break evals silently** — if you update a system prompt and don't re-run your full eval suite, you shipped a regression. Gate deploys on eval pass rate.

**Overfitting your evals** — if you tune prompts by hand against the same 20 examples you use for testing, you're just memorizing the test set. Hold out a validation set and only look at it before a major release.

**Speed matters** — an eval suite that takes 30 minutes kills iteration velocity. Keep unit evals under 60 seconds by caching model calls and using deterministic checks wherever possible. Run slow task-completion evals in a separate overnight job.

## Related Topics

- [Sampling](/topics/sampling) — for validating decoding changes instead of tuning by feel
- [Agent Frameworks](/topics/agent-frameworks) — for framework-specific failure modes that need coverage
- [Orchestration](/topics/orchestration) — for end-to-end and coordination eval design in multi-agent systems
