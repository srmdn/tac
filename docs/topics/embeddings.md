# Embeddings & Vector Stores

How to give your agent persistent access to knowledge it wasn't trained on. Embeddings convert text into numerical vectors that capture semantic meaning — similar content lands near each other in vector space. Vector stores index those vectors for fast similarity search at scale.

## The Decision

| Situation | Approach |
|-----------|----------|
| Agent needs access to a large document corpus | RAG with embeddings |
| You need exact keyword matches (legal text, IDs, codes) | BM25 / full-text search, or hybrid |
| Knowledge changes frequently | RAG (re-embed on update vs re-training) |
| Model needs facts it wasn't trained on | RAG — fine-tuning teaches behavior, not facts |
| Small dataset (<200 docs), fits in context | Stuff everything in context — skip the vector store |
| Multilingual retrieval | Multilingual embedding model (Cohere, BGE-M3) |
| Code retrieval | Code-specific embedding model (Voyage Code, CodeBERT) |

**When not to use RAG:** if your entire knowledge base fits comfortably within the model's context window and retrieval precision matters more than cost, just load it all. Retrieval introduces recall failure — you can retrieve the wrong chunks, or miss relevant ones entirely. No retrieval means no retrieval errors.

## Embedding Models

Embedding quality determines retrieval quality. The model choice matters more than the vector store choice.

### Commercial

**OpenAI** — `text-embedding-3-small` and `text-embedding-3-large`. Matryoshka embeddings: you can truncate the output dimension (e.g., 256, 512, 1536) to trade off cost and quality. Strong general-purpose performance, especially on English.

**Cohere** — `embed-v4` supports text and images in a shared embedding space (multimodal). `embed-multilingual-v3` covers 100+ languages with strong cross-lingual retrieval. Good choice for multilingual or document-heavy applications.

**Voyage AI** (Anthropic-backed) — `voyage-3` (general), `voyage-code-3` (code retrieval), `voyage-3-lite` (cost-optimized). Consistently top MTEB benchmark scores. `voyage-code-3` is the current best choice for code-heavy retrieval.

**Google** — `text-embedding-004` via Vertex AI. Strong on Google-ecosystem workloads; 768-dimensional output.

### Open Source / Self-Hosted

| Model | Dims | Notes |
|-------|------|-------|
| `BAAI/bge-large-en-v1.5` | 1024 | Best English dense retrieval; strong MTEB scores |
| `BAAI/bge-m3` | 1024 | Multilingual, dense + sparse + colbert in one model |
| `intfloat/e5-mistral-7b-instruct` | 4096 | 7B model; top MTEB but slow and expensive to run |
| `nomic-ai/nomic-embed-text-v1` | 768 | Apache 2.0; runs locally; long context (8K) |
| `jinaai/jina-embeddings-v3` | 1024 | Long context (8K), multilingual, task-adaptive |

Self-hosted embeddings eliminate API latency and cost at high volume. The tradeoff is inference infrastructure — GPU or optimized CPU serving via `text-embeddings-inference` (Hugging Face) or `FastEmbed`.

## Vector Stores

### Managed (No Infrastructure)

**Pinecone** — the most widely deployed managed vector store. Serverless and pod-based tiers. Built-in metadata filtering, namespacing, sparse-dense hybrid search. Straightforward API; strong ecosystem integrations. Pricing at scale can be high vs self-hosted.

**Qdrant Cloud** — managed version of the open-source Qdrant. Supports dense, sparse, and multi-vector (ColBERT) in one collection. Strong filtering performance. Free tier available. Can self-host the same engine if you outgrow the managed version.

**Weaviate Cloud** — managed Weaviate with built-in hybrid search (BM25 + dense). GraphQL and REST APIs. Supports multi-tenancy natively — good for SaaS applications with per-customer data isolation.

**Zilliz** — managed Milvus. Best choice if you need Milvus-compatible APIs but don't want to operate Kubernetes.

### Self-Hosted

**Qdrant** — Rust-based, fast, low memory footprint. Recommended self-hosted option for most teams. Docker single-node to Kubernetes cluster. Quantization support (scalar, product, binary) for memory reduction. Payload filtering is expressive and fast.

```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Milvus** — the most feature-complete open-source vector database. Supports GPU indexing, DiskANN for billion-scale, multiple index types (HNSW, IVF, FLAT). Operationally complex — requires etcd + MinIO + multiple services. Right for very large scale; overkill for most applications.

**Chroma** — Python-native, embedded or client-server. Easiest to get running. Right for prototyping, local development, and small production deployments. Not designed for billion-scale.

```python
import chromadb
client = chromadb.Client()
collection = client.create_collection("docs")
collection.add(documents=["doc text"], ids=["1"])
results = collection.query(query_texts=["search query"], n_results=5)
```

### Postgres-Native

**pgvector** — vector similarity search as a Postgres extension. IVFFlat and HNSW indexes. If you're already on Postgres, this eliminates a separate service. Performance lags purpose-built vector databases at high scale but is sufficient for most applications under 10M vectors.

```sql
CREATE EXTENSION vector;
CREATE TABLE documents (id bigserial, content text, embedding vector(1536));
SELECT content FROM documents ORDER BY embedding <-> '[0.1, 0.2, ...]' LIMIT 5;
```

**pgvectorscale** (Timescale) — extends pgvector with DiskANN indexing and streaming DiskANN updates. Significantly faster queries than pgvector's HNSW at large scale, while staying in Postgres.

## Chunking

How you split documents into chunks is the most underestimated factor in RAG quality.

**Fixed-size with overlap** — split every N tokens, overlap M tokens between adjacent chunks. Simple, predictable. Works poorly when meaning spans chunk boundaries.

```python
# 512 token chunks, 50 token overlap
chunks = split_by_tokens(text, chunk_size=512, overlap=50)
```

**Structure-aware** — split on document boundaries: headers, paragraphs, sentences. Preserves semantic units. Better than fixed-size for most document types. Use `langchain.text_splitter.RecursiveCharacterTextSplitter` or Unstructured.io for format-aware splitting.

**Semantic chunking** — embed sentences, then merge adjacent sentences until cosine similarity drops below a threshold. Produces variable-length chunks that respect topic shifts. Higher quality; more expensive to compute at ingestion.

**Chunk sizing guidelines:**

| Use case | Recommended chunk size |
|----------|----------------------|
| Short Q&A, facts | 128–256 tokens |
| General document retrieval | 512–1024 tokens |
| Long-form reasoning, full sections | 1K–2K tokens |

Smaller chunks improve precision (the retrieved chunk is more likely to be relevant) but hurt recall (context needed to answer may be split across chunks). Larger chunks improve recall but introduce noise. **Parent-child chunking** addresses this: index small child chunks for retrieval precision, but return the parent chunk for context.

## Retrieval Patterns

### Dense Retrieval (Baseline)

Embed the query, find top-k nearest vectors by cosine or dot-product similarity. Works well when the query and document use similar vocabulary and phrasing.

```python
query_embedding = embed(query)
results = vector_store.search(query_embedding, top_k=10)
```

### Hybrid Search (Dense + Sparse)

Combine dense retrieval with keyword search (BM25). Dense catches semantic matches; sparse catches exact keyword matches that dense can miss. Merge results with Reciprocal Rank Fusion (RRF).

```python
dense_results = vector_store.dense_search(query, top_k=10)
sparse_results = bm25_index.search(query, top_k=10)
final = reciprocal_rank_fusion([dense_results, sparse_results])
```

Hybrid search consistently outperforms dense-only on heterogeneous document sets. Qdrant, Weaviate, and Pinecone all support hybrid search natively.

### Reranking

Retrieve a large candidate set (top-50 or top-100), then use a cross-encoder reranker to score each candidate against the query. Cross-encoders are slower but far more accurate than bi-encoders for relevance scoring.

**Cohere Rerank** — API-based, drop-in. Pass query + candidates, receive ranked results. Multilingual support.

**Voyage Rerank** — Voyage AI's reranker; strong performance on technical and code content.

**Cross-encoder/ms-marco** — open-source cross-encoders from sentence-transformers. Self-hostable; slightly lower quality than Cohere/Voyage on most benchmarks but no per-call cost.

The rerank step typically adds 50–200ms but meaningfully improves answer quality for long-tail queries. Worth adding before your first accuracy complaint, not after.

## RAG in Agent Pipelines

In agent systems, retrieval typically appears as a tool call — the agent decides when to search and what to search for, rather than triggering on every turn.

```python
@beta_tool
def search_knowledge_base(query: str) -> str:
    """Search the internal knowledge base. Use when you need specific facts,
    documentation, or context that may not be in your training data."""
    results = vector_store.search(embed(query), top_k=5)
    return format_results(results)
```

**Query rewriting** — the user's raw message is often a poor search query. Before embedding, use the LLM to rewrite it as a standalone search query: `"Given this conversation, write a search query to find relevant documentation."` Improves retrieval quality significantly on multi-turn conversations.

**Hypothetical Document Embeddings (HyDE)** — instead of embedding the query, ask the LLM to generate a hypothetical answer, then embed that. The hypothetical answer is closer in embedding space to real answer documents than the query itself. Particularly effective for question-answering over technical documents.

**Multi-query retrieval** — generate 3–5 query variants, retrieve for each, deduplicate. Higher recall than single-query at the cost of more embedding calls and higher latency.

## Production Reality

**Retrieval failures are invisible without logging** — the LLM will do its best with whatever chunks you retrieved, even if they're wrong. Log the retrieved chunks alongside the response. Sample and review regularly. You can't improve what you can't see.

**Embedding model upgrades break your index** — when you upgrade the embedding model, all existing vectors must be re-embedded. Plan for this: keep the original text stored alongside vectors, and have a re-indexing pipeline ready. Mixing vectors from different models in the same collection silently degrades quality.

**HNSW index build time grows with scale** — adding vectors to an HNSW index is fast at 100K docs, slow at 50M. If you're doing bulk ingestion, build the index after loading data (batch mode), not during. Qdrant and Milvus both support this.

**Chunking strategy is the highest-leverage tuning knob** — before changing embedding models or vector stores, experiment with chunk size and chunking method. Most retrieval quality issues trace to poor chunking, not the wrong vector database.

**Costs at scale:** at 100M vectors with 1536-dimensional float32 embeddings, storage alone is ~600GB. Use scalar quantization (int8) to reduce to ~150GB with minimal quality loss. Qdrant's built-in quantization handles this without changing your application code.

## Related Topics

- [Context Management](/topics/context-management) — for deciding when retrieval beats stuffing more text into context
- [Prompt Injection & Security](/topics/prompt-injection) — for the security risks of retrieved untrusted content
- [Fine-Tuning](/topics/fine-tuning) — for the boundary between teaching behavior and retrieving facts
