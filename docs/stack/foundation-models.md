# Foundation Models

The base of the Agent Stack. Everything else is built on top of transformers, tokenizers, and weights.

## Key Concepts

- **Context Windows** — How much text a model can "remember" in a single forward pass. Not a hard limit, but a soft cliff.
- **KV Cache** — The hidden state that makes autoregressive generation fast. Also the reason long conversations cost VRAM.
- **Sampling** — Temperature, top-p, top-k. The knobs that control creativity vs determinism.
- **Quantization** — Trading precision for speed. FP16 → INT8 → INT4.

## Major Model Families

| Family | Maker | Notes |
|--------|-------|-------|
| GPT-4o / o1 / o3 | OpenAI | Broad capabilities, strong tool use |
| Claude 3.5 / 4 | Anthropic | Long context, strong reasoning |
| DeepSeek-V3 / R1 | DeepSeek | MoE architecture, cost-efficient |
| Kimi K2 | Moonshot AI | 2M context window |
| LLaMA 3 | Meta | Open weights, widely deployed |

## Economics

Foundation models are priced by the token. Input tokens are cheaper than output tokens. Cache hits are cheaper than cache misses. Understanding these economics is essential for building profitable agent systems.

[Tokens & Cost →](/topics/tokens-and-cost)
