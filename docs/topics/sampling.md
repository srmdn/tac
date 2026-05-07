# Sampling

Controlling the randomness of LLM outputs.

## Temperature

Controls creativity vs determinism.

- **0.0** — Deterministic. Same input always produces same output.
- **0.7** — Balanced. Good for general conversation.
- **1.0+** — Creative. More varied outputs, higher risk of hallucination.

## Top-p (Nucleus Sampling)

Limits the set of tokens considered at each step. A top-p of 0.9 means only tokens comprising the top 90% of probability mass are considered.

## Top-k

Limits to the K most likely tokens. Less common in modern APIs, but useful for constrained generation.

## Structured Output

Forcing the model to output valid JSON, XML, or other formats. Implemented via:

- **Constrained decoding** — Mask invalid tokens at each step.
- **Post-processing** — Parse and retry on failure.
- **Function calling** — Native structured output in many APIs.

## When to Use What

| Task | Temperature | Notes |
|------|-------------|-------|
| Code generation | 0.2 – 0.4 | Prefer correctness over creativity |
| Creative writing | 0.8 – 1.0 | Allow variation |
| Classification | 0.0 – 0.2 | Deterministic labels |
| Chat | 0.7 – 0.9 | Natural conversation |
