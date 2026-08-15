export interface SampleDocumentItem {
  name: string;
  category: string;
  type: "pdf" | "text";
  description: string;
  sampleQueries: string[];
  text?: string;
  url?: string;
}

export const SAMPLE_DOCUMENTS: SampleDocumentItem[] = [
  {
    name: "In-Browser AI & Local LLMs Whitepaper",
    category: "AI Architecture",
    type: "text",
    description:
      "Deep dive into WebGPU acceleration, ONNX Runtime WASM, Transformers.js, and zero-data-leakage client-side AI.",
    sampleQueries: [
      "How does WebGPU provide hardware acceleration in the browser?",
      "What are the privacy advantages of client-side RAG?",
      "How does chunking affect embedding retrieval accuracy?",
    ],
    text: `# In-Browser Local Artificial Intelligence and Edge Machine Learning

## Executive Summary
Client-side artificial intelligence is transforming modern computing by running deep learning models directly within user browsers. By eliminating the necessity of round-trip cloud API requests, in-browser intelligence delivers absolute data privacy, instantaneous latency, and zero operational server costs.

## Hardware Acceleration via WebGPU and WASM
Modern web standards, primarily WebGPU and WebAssembly (WASM) with SIMD instructions, grant browser JavaScript direct access to device graphics processors. WebGPU offers low-overhead computing pipelines capable of dispatching thousands of parallel matrix multiplication operations simultaneously. Unlike legacy WebGL implementations, WebGPU supports flexible compute shaders and efficient fp16/fp32 floating point arithmetic.

## Transformers.js and Local Embedding Models
Using Transformers.js, machine learning pipelines compiled to ONNX format execute locally inside isolated Web Worker threads. Models such as Xenova/all-MiniLM-L6-v2 convert arbitrary text chunks into dense 384-dimensional semantic vector embeddings. Because these embeddings reside in browser memory (IndexedDB or typed Float32Arrays), semantic similarity searches achieve sub-millisecond execution times.

## Retrieval-Augmented Generation (RAG) Architecture
Local RAG combines vector retrieval with in-browser language models (such as Llama 3.2 1B or Qwen 2.5). When a user submits an inquiry:
1. The question is converted to a query embedding.
2. Cosine similarity calculates relevance scores against stored document chunks.
3. Top-K matching chunks are extracted and injected into a strict system context prompt.
4. The local LLM generates a factual, hallucination-free response referencing only the retrieved context.

## Zero Data Leakage & Enterprise Privacy Compliance
Because all document parsing, vector indexing, similarity calculations, and generative inference occur strictly on the user's physical device, no confidential enterprise data or intellectual property is ever transmitted across public internet networks. This architecture satisfies GDPR, HIPAA, and SOC2 confidentiality requirements inherently.`,
  },
  {
    name: "Neural Network Attention & Transformers Primer",
    category: "Machine Learning",
    type: "text",
    description:
      "A technical guide covering multi-head self-attention, query-key-value vectors, positional encodings, and feed-forward layers.",
    sampleQueries: [
      "How is attention calculated using queries, keys, and values?",
      "Why are positional encodings necessary in transformers?",
      "What role does the softmax scaling factor play?",
    ],
    text: `# Neural Network Attention Mechanisms and Transformer Architectures

## Introduction to Attention
The Transformer architecture, introduced by Vaswani et al., replaced recurrent neural networks (RNNs) by introducing self-attention. Instead of processing sequence tokens sequentially, self-attention evaluates relationships between all token pairs simultaneously in constant path length.

## Scaled Dot-Product Attention Formula
The fundamental mathematical foundation of attention computes similarity between Queries (Q), Keys (K), and Values (V). Given an input sequence, linear projections produce matrices Q, K, and V of dimension d_k.
Attention is defined as:
Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V
The square root scaling factor sqrt(d_k) prevents dot products from growing excessively large for high dimensions, which would otherwise push softmax gradients into vanishing regions.

## Multi-Head Attention Mechanisms
Multi-head attention divides the embedding space into multiple parallel attention projections (heads). Each head learns independent relational patterns: one head may specialize in syntactic relationships, while another captures long-range semantic dependencies. The outputs of all heads are concatenated and multiplied by a final projection matrix W_o.

## Positional Encodings
Because transformers do not process tokens sequentially like RNNs or CNNs, they lack built-in positional awareness. To inject order into the representations, positional encodings (either sinusoidal trigonometric functions or learnable rotary embeddings RoPE) are added to the input token vectors.

## Residual Connections and Layer Normalization
Each sub-layer within a Transformer block features a residual skip connection followed by Layer Normalization (or RMSNorm). Residual connections facilitate uninterrupted gradient flow during backpropagation, enabling stable training of networks with hundreds of layers.`,
  },
  {
    name: "Vehicle Owner & Maintenance Manual",
    category: "Automotive Manual",
    type: "pdf",
    description:
      "Official car manual covering scheduled maintenance intervals, oil specifications, warning indicators, and tire care.",
    url: "/sample/car-manual.pdf",
    sampleQueries: [
      "What are the recommended maintenance intervals and oil change guidelines?",
      "What should I do if a dashboard warning light or indicator comes on?",
      "How do I check and adjust tire pressure or handle a flat tire?",
    ],
  },
];
