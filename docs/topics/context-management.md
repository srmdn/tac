# Context Management

Long-running agents accumulate context until they hit the window limit or degrade in quality before that. Managing what goes into the context window is an architectural decision, not a cleanup task.

## The Decision

Before your agent goes to production, decide: what is the maximum conversation length you'll support, and what happens when you reach it? If you don't decide in advance, you'll decide under pressure when a user hits the limit.

| Situation | Recommended strategy |
|-----------|----------------------|
| Short, single-turn tasks | No management needed |
| Multi-turn chat (<20 turns) | Sliding window |
| Long-running agents (>20 turns or long tool outputs) | Summarization + sliding window |
| Retrieval over large corpora | [RAG](/topics/embeddings) — never stuff everything in context |
| Cross-session continuity | External memory store |

## What Fills Your Context Window

Every token in context costs money and degrades attention. Know what's eating your budget:

1. **System prompt** — fixed cost per request. Often larger than you think (1K–5K tokens is common).
2. **Conversation history** — grows with every turn. The biggest driver of context bloat.
3. **Tool results** — raw API responses, database rows, search results. Often much larger than necessary.
4. **Retrieved documents** — RAG chunks, attached files. Easy to over-retrieve.
5. **Model reasoning** — some models return thinking tokens that count against your budget.

## Strategies

### Sliding Window

Keep only the last N tokens of history. Simple, effective for most chat use cases.

```python
def trim_history(messages, max_tokens=50_000):
    while count_tokens(messages) > max_tokens:
        messages.pop(0)  # drop oldest messages
    return messages
```

Tradeoff: the model loses access to early context. If the user mentioned their name in message 1 and you're now on message 50, it's gone.

### Summarization

Periodically compress old history into a summary and replace it. Preserves key facts while reducing token count.

```
[SUMMARY OF EARLIER CONVERSATION]
User is debugging a payment integration. Has already tried: restarting the service, checking API keys. 
Currently investigating webhook signature verification.
[END SUMMARY]

[RECENT MESSAGES - last 10 turns]
...
```

Tradeoff: summarization itself costs tokens and introduces latency. The summary may omit details that turn out to matter. Good for long conversations where early specifics are less important than overall context.

### RAG (Retrieval-Augmented Generation)

Instead of putting a large knowledge base in context, retrieve only the relevant chunks at query time.

Key design choices:
- Chunk size — smaller chunks (200–500 tokens) give better precision; larger chunks (800–1500) give better context
- Top-k — how many chunks to retrieve. More isn't always better; irrelevant chunks degrade quality
- Reranking — a second pass to score relevance before final retrieval significantly improves results

Tradeoff: retrieval adds latency (~100–500ms). The model can't reason across information it didn't retrieve.

For embedding models, vector store options, chunking strategies, and hybrid retrieval patterns, see [Embeddings & Vector Stores](/topics/embeddings).

### External Memory

Persist important information outside the context window and inject it selectively:

- **Episodic memory** — specific past events ("user mentioned they're on the Pro plan")
- **Semantic memory** — distilled facts ("user prefers concise answers")
- **Working memory** — current task state ("step 3 of 5 complete, pending: X")

Libraries like MemGPT/Letta implement this pattern; you can also build it directly with a [vector store](/topics/embeddings).

## Token Budget Management

Set explicit token budgets for each context component and enforce them:

```python
SYSTEM_PROMPT_BUDGET = 2_000
HISTORY_BUDGET = 40_000
TOOL_RESULTS_BUDGET = 10_000
RETRIEVED_DOCS_BUDGET = 20_000
```

When a component exceeds its budget, truncate or summarize before adding to context. This prevents any single component from crowding out others.

For tool results: retrieve only the fields you need. If a database query returns 50 columns but the model only needs 3, project before inserting into context.

## The Attention Soft Cliff

Context window size tells you how many tokens fit. It doesn't tell you how well the model attends to them.

Most models show degraded performance when:
- Critical information appears in the middle of a very long context ("lost in the middle" problem)
- The same information is repeated with contradictions at different positions
- Tool results are interspersed with long unrelated conversation

Practical mitigations:
- Put the most important information at the beginning and end of context
- Keep system instructions near the top, not buried after a long history
- For retrieval, put the retrieved content immediately before the question

## Production Reality

**Context bloat is slow and invisible** — you won't notice it during development on short conversations. Add context length tracking to your metrics. Track average tokens per request in production.

**Tool results are the surprise** — developers estimate token usage based on conversation history and miss that tool results are often 2–10x larger. Log token counts per component, not just totals.

**Summarization quality degrades under pressure** — if you summarize too aggressively (compressing 50 turns into 200 tokens), the summary becomes useless. Test summarization quality explicitly as part of your evals.

**Context poisoning** — if incorrect information enters context early (wrong tool result, hallucinated fact), it can anchor the model's subsequent reasoning. Models are bad at self-correcting against their own earlier context. Clean up known-bad context explicitly rather than expecting the model to override it.

## Related Topics

- [Context Windows](/topics/context-windows) — for the hard model limits behind your token budget
- [Embeddings & Vector Stores](/topics/embeddings) — for retrieval patterns that reduce context pressure
- [Tool Use & Function Calling](/topics/tool-use) — for keeping tool outputs structured and smaller before they hit context
