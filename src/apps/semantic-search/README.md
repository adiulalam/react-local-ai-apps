# Local In-Browser Semantic Search (RAG)

A fully private, client-side semantic search and Retrieval-Augmented Generation (RAG) application running 100% in your browser.

## Features

- **Multi-Format Document Parsing**: Upload PDF (`.pdf`), Word (`.docx`), Markdown (`.md`), Plain Text (`.txt`), CSV (`.csv`), JSON (`.json`), or paste raw text.
- **Smart Chunking**: Configurable paragraph-based and sliding-window text chunking with word count control and overlap tuning.
- **Client-Side Vector Indexing**: Generates dense 384-dimensional vector embeddings using Transformers.js with `Xenova/all-MiniLM-L6-v2`.
- **Instant Cosine Similarity Matching**: Sub-millisecond vector similarity calculations across all stored chunks in local memory.
- **Interactive Document Highlighting**: Dynamically highlights matching paragraphs with color-coded relevance badges and smooth auto-scroll.
- **True Local RAG Chat**: Hallucination-free conversational Q&A grounded strictly in retrieved context with verified source citations (`[Chunk 1]`, `[Chunk 2]`).
- **Zero Server Telemetry**: All parsing, embeddings, searches, and inference occur strictly on the user's physical device.
