# Sampling

How a model chooses the next token. The parameters here determine whether outputs are deterministic, natural, or chaotic — and whether structured outputs parse reliably.

## The Decision

Most production applications need two modes:

| Mode | Settings | When to use |
|------|----------|-------------|
| Deterministic | temperature 0 | Classification, extraction, structured output, evals |
| Natural | temperature 0.7–1.0, top_p 0.9–0.95 | Conversation, summarization, content generation |

Don't tune sampling parameters by feel. Test against your eval set and measure the difference.

## How Token Selection Works

After the forward pass, the model produces a probability distribution over its full vocabulary (32K–128K tokens depending on the model). Sampling parameters control how the next token is drawn from that distribution.

Without any constraints, the model always picks the highest-probability token (greedy decoding). Most applications want some variation — sampling parameters introduce controlled randomness.

```
Prompt: "The sky is"
  Greedy (temp=0): "blue" (probability: 0.82)
  Sampling (temp=0.8): "blue" (82%), "clear" (8%), "getting" (4%), ...
```

## Temperature

Scales the raw model scores (logits) before converting to probabilities. Lower = sharper distribution, higher = flatter.

```
temperature = 0.0  → always the top token (greedy)
temperature = 1.0  → raw model distribution unchanged
temperature > 1.0  → flatter, more uniform — low-probability tokens get more chances
```

Low temperature makes outputs more confident and repetitive. High temperature makes them more varied and more likely to produce off-distribution outputs — hallucinations, non-sequiturs.

**Practical ranges:**

| Task | Temperature |
|------|-------------|
| Structured output, JSON extraction | 0.0 – 0.2 |
| Code generation | 0.2 – 0.4 |
| Factual Q&A, summarization | 0.3 – 0.6 |
| Conversation, explanations | 0.6 – 0.9 |
| Creative writing, brainstorming | 0.8 – 1.2 |

## Top-p (Nucleus Sampling)

Restricts token selection to the smallest set of tokens whose cumulative probability exceeds p.

```
top_p = 0.9 → sample only from tokens covering the top 90% of probability mass
top_p = 1.0 → all tokens eligible (no restriction)
```

Top-p adapts to the distribution's shape. When the model is confident (one token has 90% probability), top_p=0.9 restricts to just that token. When uncertain (many tokens at 2–5% each), top_p=0.9 includes dozens of candidates.

**Typical values:** 0.9–0.95 for most tasks. Avoid values below 0.7 unless you want very constrained outputs.

## Top-k

Restricts selection to the k most probable tokens regardless of their probability values.

```
top_k = 1  → greedy (same as temperature=0)
top_k = 40 → sample from the 40 most likely tokens
```

Less commonly exposed in modern hosted APIs than temperature and top-p. More useful in self-hosted setups where you need tight vocabulary control.

## How Temperature and Top-p Interact

They're applied sequentially: temperature scales the logits first; top-p then filters the resulting distribution.

The common pairing `temperature=0.7, top_p=0.9` works well for most conversational tasks. Don't fiddle with both simultaneously — the combined effect is hard to reason about.

:::tip
Some providers recommend setting only one of temperature or top-p and leaving the other at its default. This avoids double-constraining the distribution in ways that are hard to predict.
:::

## Structured Output

When you need guaranteed-valid JSON or a specific schema:

**Constrained decoding** — the serving infrastructure masks invalid tokens at each generation step. The model can only emit tokens that keep the output valid against the schema. Produces valid output every time, every request.

```python
# OpenAI
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "result", "schema": my_schema}
    }
)

# Anthropic — tool use returns structured output by construction
response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=[{"name": "extract", "input_schema": my_schema}],
    tool_choice={"type": "tool", "name": "extract"},
    messages=[...]
)
```

**Post-processing with retry** — generate free text, parse it, retry on failure. Works but adds latency and cost per retry cycle. Use only when the native structured output APIs aren't available.

For production: use the native structured output APIs. They use constrained decoding under the hood and eliminate parse failures entirely.

## Repetition Penalty

A separate parameter (not temperature) that penalizes tokens already present in the output. Values above 1.0 increase the penalty; 1.0 means no penalty.

Use it when:
- The model is looping or echoing itself (common at low temperatures)
- Generating long-form content where lexical variety matters

Typical values: 1.1–1.3. Higher values can distort output quality, so test carefully.

## Production Reality

**Temperature 0 is not truly deterministic** — most providers don't guarantee identical outputs at temperature=0 across different server deployments, model updates, or concurrent requests due to floating-point non-determinism. Use seeds where the API supports them if reproducibility matters.

**Sampling doesn't fix bad prompts** — the default reflex when outputs are wrong is to adjust temperature. Usually the prompt is the problem. Fix the prompt first; adjust sampling after the prompt is stable.

**Structured output + high temperature = mostly fine** — when using JSON schema mode, temperature affects choices within valid JSON paths. You can keep a moderate temperature without losing parse reliability, since constrained decoding enforces validity.

**Eval your sampling config after changes** — a setting that feels better in interactive testing can silently regress on edge cases. Re-run your eval suite after any significant sampling parameter change.

## Related Topics

- [Tool Use & Function Calling](/topics/tool-use) — for structured outputs, argument reliability, and schema-constrained generation
- [Evaluations](/topics/evals) — for testing whether sampling changes improve or regress real tasks
- [Reasoning Models](/topics/reasoning-models) — for cases where model choice matters more than sampling settings
