# Context Windows

How much text a model can process in a single forward pass.

## The Basics

A context window is measured in tokens, not characters. Common sizes:

| Model | Context Window |
|-------|---------------|
| GPT-4o | 128K |
| Claude 3.5 Sonnet | 200K |
| Kimi K2 | 2M |
| DeepSeek-V3 | 128K |

## What Happens at the Limit

When input exceeds the context window, the model cannot "see" the overflow. Strategies to handle this:

- **Truncation** — Cut from the beginning (oldest messages).
- **Summarization** — Compress old context into a summary.
- **Sliding window** — Keep only the last N tokens.
- **RAG** — Retrieve relevant chunks instead of stuffing everything.

## The Soft Cliff

Performance degrades before the hard limit. Attention mechanisms struggle to maintain coherence across very long contexts. A 200K window does not mean 200K tokens are equally "visible."

:::warning
Do not assume a large context window eliminates the need for RAG or summarization. It postpones the problem, it does not solve it.
:::
