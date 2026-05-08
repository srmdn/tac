# Tool Use & Function Calling

Models don't call functions — they generate structured text that describes a function call. Your runtime executes it. Understanding this distinction explains most tool use failures.

## How It Works

When you define tools, they're serialized into the prompt (typically as JSON schema). The model reads them like any other context and generates a structured output — a JSON object naming the tool and its arguments. Your code parses that output and executes the actual function.

```
System prompt + tool definitions + conversation
      ↓
Model outputs: { "tool": "search", "arguments": { "query": "..." } }
      ↓
Your code calls: search(query="...")
      ↓
Result goes back into context as a tool result
```

The model sees tool definitions as documentation. If the documentation is unclear, the model will guess — and guess wrong.

## Writing Tools the Model Uses Reliably

The name and description are the model's only guide. Treat them like function signatures in a public API.

**Name** — use verb + noun. `search_documents`, `send_email`, `create_ticket`. Avoid generic names like `do_action` or `process`.

**Description** — one sentence: what it does, when to use it, what it returns. Include what it does NOT do if the boundary is non-obvious.

```json
{
  "name": "get_order_status",
  "description": "Returns the current status and estimated delivery date for an order ID. Use this when the user asks about a specific order. Does not handle returns or refunds.",
  "parameters": {
    "order_id": {
      "type": "string",
      "description": "The order ID from the confirmation email, format: ORD-XXXXXXXX"
    }
  }
}
```

**Parameters** — be explicit about format, units, and valid values. `"timestamp in ISO 8601 format"` is better than `"a date"`. If a parameter is optional, say what happens when it's omitted.

## Parallel vs Sequential Tool Calls

Most frontier models can emit multiple tool calls in a single turn. Whether they do depends on whether the calls are independent.

If a user asks "get me the weather in Paris and Berlin," a capable model will call `get_weather("Paris")` and `get_weather("Berlin")` simultaneously. If it asks "search for X, then summarize what you find," the second call depends on the first — so it'll call them sequentially.

You can influence this by structuring your prompt:
- "Do these steps in order" → sequential
- "Gather all the information you need before answering" → may produce parallel calls

Parallel tool calls reduce latency but require your runtime to handle concurrent execution correctly.

## Error Recovery Patterns

Tools fail. The model needs to know what failure looks like so it can recover.

Return structured errors, not silent null or raw exceptions:

```json
{ "error": "not_found", "message": "Order ORD-12345 does not exist" }
```

Tell the model explicitly what to do:

```
If a tool returns an error, explain to the user what failed and what alternatives exist. Do not silently retry.
```

For long tool chains, specify what partial success looks like. If step 3 of 5 fails, should the agent abort the whole task or continue with what it has?

## Controlling Tool Use

**Forcing a tool call** — some APIs let you specify `tool_choice: required` or name a specific tool. Use this for structured extraction tasks where you always need a specific output format.

**Preventing spurious calls** — if a model calls tools unnecessarily, tighten the descriptions ("only call this when the user explicitly requests X") or use `tool_choice: none` when you want a plain text response.

**Tool call budgets** — for agentic loops, set a maximum number of tool calls per session. Uncapped loops can spiral: a model that fails at step 2 may retry indefinitely if nothing tells it to stop.

## Structured Output vs Tool Use

Tools return results back to the model; structured output extracts a final answer in a fixed schema. They're different things:

- Use **tools** when the model needs the result to continue its reasoning
- Use **structured output** (JSON mode, response schema) when you want the final response in a parseable format

For extraction tasks (pull these fields from this document), structured output is simpler and cheaper than a round-trip tool call.

## Production Reality

**Tool call reliability varies by model** — smaller or older models hallucinate tool names, pass arguments in the wrong format, or call tools when they shouldn't. If reliability matters, test each model against your tool set explicitly — don't assume. For small models where reliability is structurally poor, [fine-tuning on tool-calling examples](/topics/fine-tuning#fine-tuning-for-agents) is the most direct fix.

**Schema drift breaks silently** — if you change a tool's parameter names or types without updating every call site, the model will generate calls that parse against the old schema. Version your tools.

**Argument hallucination** — if required arguments aren't present in context, the model invents them. A model asked to fetch order status without an order ID in the conversation will often make one up. Validate all arguments before executing.

**Long tool result chains inflate cost** — every tool result goes back into context. If you call 10 tools per turn, each returning 2K tokens, you're burning 20K tokens per turn in tool results alone. Truncate large results and return only what the model needs.
