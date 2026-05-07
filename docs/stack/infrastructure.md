# Infrastructure

The systems that make inference economical at scale.

## Core Components

### Model Serving

Turning a model file into an API endpoint. Options range from managed (OpenAI, Anthropic) to self-hosted (vLLM, llama.cpp, TGI).

[LLM Serving →](/topics/llm-serving)

### Prompt Caching

Reusing KV cache across requests. The difference between paying full price and paying 10% for repeated context.

[Prompt Caching →](/topics/prompt-caching)

### Routing

Sending each request to the right model. A chat query might go to GPT-4o; a code generation task to Claude; a summarization job to a cheap local model.

### Observability

Tracing, logging, cost attribution. You cannot optimize what you cannot measure.

## The Cost Stack

```
User Request
    ↓
Routing Layer — picks model
    ↓
Cache Check — KV cache hit?
    ↓
Tokenization — text → tokens
    ↓
Inference — forward pass
    ↓
Detokenization — tokens → text
    ↓
User Response
```

Every step has a cost in time, money, or both.
