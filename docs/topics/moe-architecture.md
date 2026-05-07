# MoE Architecture

Mixture of Experts. Why DeepSeek can be 671B total but 37B active.

## The Core Idea

Instead of one dense model, use a router to select a subset of "expert" networks for each token. Most parameters are inactive on any given forward pass.

## Architecture

```
Input Token
    ↓
Router — computes gate scores
    ↓
Top-K Experts selected (e.g., 2 of 256)
    ↓
Expert outputs weighted by gate scores
    ↓
Output Token
```

## Why It Matters

| Model | Total Params | Active Params | Cost per Token |
|-------|-------------|---------------|----------------|
| GPT-4 (est.) | ~1.8T | ~1.8T | High |
| DeepSeek-V3 | 671B | 37B | Low |
| LLaMA 3 70B | 70B | 70B | Medium |

MoE decouples model capacity from inference cost. You get the knowledge of a huge model with the speed of a small one.

## Challenges

- **Load balancing** — Ensure all experts are used, not just a few.
- **Communication overhead** — Expert parallelism across GPUs adds latency.
- **Fine-tuning** — MoE models are harder to fine-tune effectively.

:::info
MoE is not new (Shazeer et al., 2017), but modern implementations at DeepSeek and Mistral have made it practical at scale.
:::
