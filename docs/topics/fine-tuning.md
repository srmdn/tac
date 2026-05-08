# Fine-Tuning

Should you fine-tune, or is a better prompt enough? Fine-tuning is the right answer less often than people expect — but when it is the right answer, it's clearly the right answer.

## The Decision

| Situation | Fine-tune? |
|-----------|-----------|
| Model doesn't reliably produce the right output format | Try structured output APIs first. Fine-tune if still unreliable. |
| System prompt is huge and costing too much | Yes — distill the behavior into a smaller fine-tuned model |
| Model lacks domain-specific knowledge | No — use RAG. Fine-tuning teaches behavior, not facts. |
| Need a specific tone or writing style consistently | Yes — style is hard to prompt reliably at scale |
| Task is narrow, well-defined, and high-volume | Yes — fine-tuning a smaller model beats calling a frontier model |
| Task changes frequently | No — fine-tuning is a maintenance burden; prompts are easier to update |
| Agent tool-calling is unreliable on a small model | Yes — tool-use fine-tuning is one of the highest-ROI applications |

**The core rule:** fine-tuning teaches a model *how to behave*, not *what to know*. If the problem is missing knowledge, RAG is the answer. If the problem is inconsistent behavior or format, fine-tuning is worth considering.

## Approaches

### Full Fine-Tuning

Update all model weights on your dataset. Produces the best results but requires significant GPU memory and compute.

- Rarely practical for models above 7B parameters without a large GPU cluster
- Risk of catastrophic forgetting — the model can lose general capability while gaining task-specific performance
- Reserved for cases where you have 100K+ high-quality examples and the task is very far from the base model's behavior

### LoRA (Low-Rank Adaptation)

The standard approach for most fine-tuning use cases. Adds small trainable adapter layers on top of frozen base weights; only the adapters are updated during training.

- Works on consumer hardware (A100 40GB handles 13B models; RTX 4090 handles 7B)
- Quality close to full fine-tuning for most tasks
- Adapters are small (~10–100MB) and swappable — you can maintain multiple LoRA adapters on one base model
- Standard choice for 1K–100K example datasets

### QLoRA (Quantized LoRA)

LoRA on a quantized (INT4) base model. Cuts VRAM requirements by ~4× vs full precision LoRA.

- 70B model fine-tuning on 2× A100 80GB — otherwise impractical
- Slight quality tradeoff vs LoRA in full precision
- Right choice when you want to fine-tune a larger model but have limited GPU resources

### Instruction Tuning

Fine-tuning on instruction-response pairs to improve general instruction following, tool use, or output format adherence. This is how models like NousResearch's Hermes series are produced from base models.

- Small dataset of high-quality instruction pairs (500–5K) can meaningfully shift model behavior
- Particularly effective for tool calling, JSON output, and format consistency
- The quality of examples matters far more than quantity here

## Data Requirements

**Quality over quantity** — 1,000 clean, consistent examples outperform 50,000 noisy ones. Most fine-tuning failures trace back to inconsistent or low-quality training data, not insufficient data volume.

**Minimum viable dataset by task:**

| Task | Minimum examples | Notes |
|------|-----------------|-------|
| Format / output structure | 200–500 | High consistency required |
| Style / tone adaptation | 500–2K | Cover edge cases |
| Tool calling reliability | 1K–5K | Include negative examples (wrong tool not called) |
| Domain behavior | 5K–20K | Depends on domain complexity |
| Full capability shift | 50K+ | Approaching full fine-tuning territory |

**Data preparation checklist:**
- Deduplicate — repeated examples overfit specific patterns
- Balance — if some classes are rare in prod, they'll be rare in training
- Include failures — examples of what the model should *not* do improve reliability more than additional positive examples
- Match distribution — if your prod inputs have typos, noise, or mixed languages, your training data should too
- Validate format — every example should pass your output schema before training

## Providers

### OpenAI

Fine-tuning available for GPT-4o mini and GPT-3.5-turbo. Managed pipeline — upload a JSONL file, trigger a job, deploy automatically. Supports supervised fine-tuning and preference fine-tuning (DPO).

- Easiest path if you're already on OpenAI
- Black box — you don't own the weights; model is hosted by OpenAI
- Per-token training cost on top of inference cost

### Google Vertex AI

Fine-tuning for Gemini models via Vertex AI. Supervised tuning and reinforcement from human feedback (RLHF) options.

- Deep GCP integration — convenient for teams already in the Google Cloud ecosystem
- Supports adapter-based tuning; tuned models served via Vertex endpoints

### Together AI

Fine-tuning on 200+ open-source models. You own the resulting weights and can export or self-host.

- Best selection of base models for fine-tuning (Llama 4, Mistral, Qwen, and more)
- Dedicated GPU instances for serving your fine-tuned model
- Right choice when you want control over weights and portability

### Fireworks AI

Fine-tuning plus optimized deployment (FireAttention kernels). Particularly strong for structured output and tool-calling fine-tunes — the custom kernels shine on constrained generation.

- Fast structured output serving for fine-tuned models
- Good for production pipelines where inference speed on fine-tuned models matters

### Self-Hosted

Use `transformers` + `peft` + `trl` (HuggingFace libraries) with Axolotl or LLaMA-Factory as training orchestrators. Full control over base model, training config, and the resulting weights.

```bash
# Axolotl: config-driven fine-tuning on top of HuggingFace
axolotl train config.yaml

# LLaMA-Factory: supports LoRA/QLoRA on most popular architectures
llamafactory-cli train lora_config.yaml
```

- Right when you have GPU infrastructure and need full control
- Significant setup and maintenance burden vs managed providers
- Required if your data is sensitive and cannot leave your infrastructure

## Fine-Tuning for Agents

Agent pipelines have specific fine-tuning opportunities that don't exist in single-turn applications.

**Tool calling reliability** — smaller models (7B–13B) often call the wrong tool, pass malformed arguments, or fail to call tools at all on ambiguous inputs. Fine-tuning on 1K–5K curated tool-calling examples brings reliability close to frontier models on well-defined tool sets. This is the highest-ROI fine-tuning use case for agent builders.

**Distillation from frontier to small** — run your agent with a frontier model (Claude Sonnet 4.6, GPT-5.5) on representative inputs; collect the input/output pairs; fine-tune a smaller model (Llama 3 8B, Mistral 7B) on them. For narrow, well-defined subtasks within an agent pipeline, the distilled model can match frontier quality at a fraction of the cost.

**Output format adherence** — agents that need to produce strictly formatted JSON (tool call arguments, structured plans, typed responses) benefit significantly from format fine-tuning. Even 200–500 examples meaningfully reduces format errors vs prompting alone.

**What fine-tuning can't fix in agents:** reasoning errors, hallucination of facts, and failure on novel inputs outside the training distribution. These are model capability limits, not behavior limits — no amount of fine-tuning on a 7B model makes it reason like a frontier model.

## MoE Models

Fine-tuning MoE models (DeepSeek V4, Llama 4 Maverick) carries specific risks not present with dense models. See [MoE Architecture](/topics/moe-architecture#fine-tuning-moe-models) for the full breakdown — the short version: router disruption and expert imbalance make MoE fine-tuning significantly harder than dense model fine-tuning at the same parameter count. Use a dense base model for fine-tuning use cases unless you have very large datasets and specific expertise.

## Production Reality

**Most fine-tuning attempts fail on data quality, not technique** — teams spend weeks setting up training pipelines only to find the resulting model is worse than the base model. Audit 100 random training examples manually before training. If you find inconsistencies or errors in more than 5%, fix the data first.

**Fine-tuned models need re-tuning** — a model fine-tuned on your data today will drift from your desired behavior as your product evolves. Budget for quarterly re-tuning cycles if fine-tuning is core to your product.

**Evaluate on held-out data, not training data** — fine-tuning optimizes for the training distribution. Always hold out 10–20% of your data for evaluation and measure performance on that set. A model that scores well on training data and poorly on held-out data has overfit.

**Start with the smallest model that could possibly work** — fine-tuning a 7B model is 10× cheaper and faster than fine-tuning a 70B model. If a fine-tuned 7B meets your quality bar on eval, ship it. Scale up only if it doesn't.

**Structured output APIs reduce the need for format fine-tuning** — before reaching for fine-tuning to fix output format issues, try Anthropic's structured output mode, OpenAI's JSON mode, or constrained decoding in SGLang/Fireworks. These enforce grammar-level constraints at inference time without any training data.
