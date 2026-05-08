# MoE Architecture

Mixture of Experts. The architecture that lets DeepSeek-V3 have 671B total parameters but only activate 37B per token — delivering frontier capability at a fraction of the inference cost of a dense model the same size.

## Why It Matters to Builders

You don't need to understand MoE to use a model — but understanding it explains two things that affect your production decisions:

1. **Why MoE models are cheap** — cost correlates with active parameters, not total parameters
2. **Why MoE models can be slow to self-host** — total parameter count drives memory requirements even if only a fraction is activated

## The Core Idea

A standard (dense) transformer runs every parameter on every token. MoE replaces the feedforward layers with a collection of expert networks and a router that decides which experts handle each token.

```
Dense transformer FFN:
  token → single FFN (all weights active) → output

MoE transformer FFN:
  token → Router → select Top-K experts
        → run only those K expert FFNs
        → weighted sum of expert outputs → output
```

If a model has 256 experts and activates 2 per token, only 2/256 = ~0.8% of the expert weights are used per forward pass. Total parameter count stays large (capacity for diverse knowledge), but compute per token stays low (only 2 experts' worth of FLOPs).

## Architecture Details

### The Router

A small learned linear layer that computes a score for each expert and selects the top-K. The scores are used to weight the outputs of the selected experts:

```
output = Σ(softmax_score_i × expert_i(token))  for i in top_K
```

The router learns which types of content each expert handles. Different experts specialize in different domains, languages, or reasoning patterns — this specialization emerges from training, not from explicit design.

### Expert Granularity

| Model | Total experts | Active per token | Expert type |
|-------|--------------|-----------------|-------------|
| DeepSeek-V3 | 256 + 1 shared | 8 | Fine-grained (small experts) |
| DeepSeek-R1 | 256 + 1 shared | 8 | Fine-grained |
| Mixtral 8×7B | 8 | 2 | Coarse (full FFN each) |
| Mixtral 8×22B | 8 | 2 | Coarse |
| Llama 4 Scout | 16 experts | variable | MoE in attention layers too |

DeepSeek uses "fine-grained" experts — many small experts rather than a few large ones. More experts → more routing flexibility → better specialization, but also more routing overhead.

## Why MoE Models Are Cheap

The compute for a forward pass scales with active parameters, not total parameters.

| Model | Total params | Active params | $/1M tokens (input) |
|-------|-------------|---------------|---------------------|
| GPT-4 (estimated dense) | ~1.8T | ~1.8T | $10.00 |
| DeepSeek-V3 (MoE) | 671B | 37B | $0.56 |
| Llama 3 70B (dense) | 70B | 70B | ~$0.90 (via Together AI) |
| Mixtral 8×22B (MoE) | 141B | 39B | ~$0.65 (via Together AI) |

DeepSeek-V3 costs less than Llama 3 70B per token despite having 10× more total parameters — because its active parameter count is similar, and because MoE models at inference time only compute the active slice.

## Why MoE Models Are Hard to Self-Host

The savings in compute don't translate to savings in memory. All 671B parameters of DeepSeek-V3 have to reside in VRAM (or be paged), even though only 37B are active per token.

```
DeepSeek-V3 memory requirements:
  FP16: ~1.3 TB VRAM (not feasible on single node)
  INT4: ~340 GB VRAM (4–5× A100 80GB)
  INT2: ~170 GB VRAM (lossy, quality degrades significantly)
```

This is the MoE self-hosting paradox: cheap to run at an API provider with large shared GPU clusters; expensive to run yourself because you can't take advantage of the active-parameter efficiency unless you can afford to store the full weight set.

## Load Balancing

A key challenge in MoE training: if the router always sends tokens to the same few experts, those experts see high gradient updates and specialize, which makes the router more likely to prefer them — a positive feedback loop that leads to "expert collapse."

**Auxiliary load balancing loss** — during training, an auxiliary term penalizes uneven expert utilization. This pushes the router to distribute tokens across experts.

**Expert capacity limits** — each expert has a maximum token budget per batch. Tokens routed to an over-capacity expert are dropped (or handled by a fallback). This forces distributional balance at the cost of occasional token-drop.

In inference, these training-time interventions are baked in — you don't need to worry about them. But understanding them explains why MoE routing quality varies across prompts and why some MoE models are more reliable than others.

## Fine-Tuning MoE Models

Fine-tuning a MoE model is more complicated than fine-tuning a dense model:

- **Router disruption** — fine-tuning can shift the router's learned distributions, causing unexpected expert assignments on new domains
- **Expert imbalance** — small fine-tuning datasets can over-train certain experts, degrading general capability
- **LoRA on MoE** — you need to decide whether to put LoRA adapters on all experts, selected experts, or just the router

In practice: unless you have substantial fine-tuning data (>100K examples) and expertise in MoE training dynamics, use a dense model for fine-tuning use cases. Use MoE via API for inference.

## Production Reality

**MoE models via managed APIs are just cheaper frontiers** — you don't need to think about the architecture. DeepSeek V4 through the DeepSeek API, Llama 4 through Groq, Mixtral through Mistral — all deliver MoE economics without the self-hosting overhead.

**Latency can be higher despite lower compute** — expert parallelism across GPUs introduces communication overhead. DeepSeek-V3 uses custom inter-GPU communication (IBGDR) to minimize this, but multi-GPU MoE serving has higher latency than a comparably-sized dense model on a single GPU.

**Expert dropout in INT4** — aggressively quantized MoE models lose more quality than equivalent dense models at the same bit-width. The router operates on FP16; if expert weights are INT4, the route may be correct but the expert computation is degraded. Test quantized MoE models more carefully before deploying.
