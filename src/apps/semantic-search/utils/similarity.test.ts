import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankChunksBySimilarity } from "./similarity";
import type { DocumentChunk } from "./text-chunker";

describe("cosineSimilarity", () => {
  it("should return 1.0 for identical vectors", () => {
    const vecA = new Float32Array([1, 2, 3]);
    const vecB = new Float32Array([1, 2, 3]);
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBeCloseTo(1.0, 5);
  });

  it("should return 1.0 for parallel vectors of different magnitudes", () => {
    const vecA = [1, 2, 3];
    const vecB = [2, 4, 6];
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBeCloseTo(1.0, 5);
  });

  it("should return 0.0 for orthogonal vectors", () => {
    const vecA = new Float32Array([1, 0, 0]);
    const vecB = new Float32Array([0, 1, 0]);
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBeCloseTo(0.0, 5);
  });

  it("should clamp negative cosine similarity to 0.0", () => {
    const vecA = [1, 0, 0];
    const vecB = [-1, 0, 0];
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBe(0.0);
  });

  it("should return 0 when one or both vectors are zero vectors", () => {
    const vecA = new Float32Array([0, 0, 0]);
    const vecB = new Float32Array([1, 2, 3]);

    expect(cosineSimilarity(vecA, vecB)).toBe(0);
    expect(cosineSimilarity(vecB, vecA)).toBe(0);
    expect(cosineSimilarity(vecA, vecA)).toBe(0);
  });

  it("should handle vectors of different lengths gracefully by using the minimum length", () => {
    const vecA = [1, 2, 3, 4];
    const vecB = [1, 2, 3];
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1.0);
  });
});

describe("rankChunksBySimilarity", () => {
  const mockChunks: DocumentChunk[] = [
    {
      id: "chunk-1",
      index: 0,
      text: "Introduction to Artificial Intelligence and Machine Learning.",
      charStart: 0,
      charEnd: 60,
      wordCount: 7,
      preview: "Introduction to Artificial Intelligence...",
    },
    {
      id: "chunk-2",
      index: 1,
      text: "Deep neural networks and Transformer attention mechanisms.",
      charStart: 61,
      charEnd: 119,
      wordCount: 7,
      preview: "Deep neural networks...",
    },
    {
      id: "chunk-3",
      index: 2,
      text: "Renewable solar energy and offshore wind turbines.",
      charStart: 120,
      charEnd: 170,
      wordCount: 7,
      preview: "Renewable solar energy...",
    },
  ];

  const mockChunkEmbeddings: Float32Array[] = [
    new Float32Array([0.9, 0.1, 0.0]), // Closest to AI
    new Float32Array([0.8, 0.4, 0.0]), // Second closest to AI
    new Float32Array([0.0, 0.0, 0.9]), // Unrelated / Solar energy
  ];

  it("should return matches sorted by cosine similarity in descending order", () => {
    const queryEmbedding = new Float32Array([1.0, 0.0, 0.0]); // Search for AI
    const matches = rankChunksBySimilarity(queryEmbedding, mockChunks, mockChunkEmbeddings, 5, 0.1);

    expect(matches.length).toBe(2);
    expect(matches[0].chunk.id).toBe("chunk-1");
    expect(matches[0].rank).toBe(1);
    expect(matches[0].score).toBeGreaterThan(matches[1].score);
    expect(matches[0].percentage).toBe(Math.round(matches[0].score * 100));

    expect(matches[1].chunk.id).toBe("chunk-2");
    expect(matches[1].rank).toBe(2);
  });

  it("should filter out chunks below minThreshold", () => {
    const queryEmbedding = new Float32Array([1.0, 0.0, 0.0]);
    const matches = rankChunksBySimilarity(
      queryEmbedding,
      mockChunks,
      mockChunkEmbeddings,
      5,
      0.95 // High threshold
    );

    // chunk-1 score is approx 0.99388
    expect(matches.length).toBe(1);
    expect(matches[0].chunk.id).toBe("chunk-1");
  });

  it("should respect topK parameter", () => {
    const queryEmbedding = new Float32Array([0.8, 0.3, 0.0]);
    const matches = rankChunksBySimilarity(
      queryEmbedding,
      mockChunks,
      mockChunkEmbeddings,
      1, // Only return top 1
      0.1
    );

    expect(matches.length).toBe(1);
    expect(matches[0].rank).toBe(1);
  });

  it("should return empty array when queryEmbedding or chunks or chunkEmbeddings are empty", () => {
    const queryEmbedding = new Float32Array([1, 0, 0]);

    expect(rankChunksBySimilarity(queryEmbedding, [], mockChunkEmbeddings)).toEqual([]);
    expect(rankChunksBySimilarity(queryEmbedding, mockChunks, [])).toEqual([]);
    expect(
      rankChunksBySimilarity([] as unknown as Float32Array, mockChunks, mockChunkEmbeddings)
    ).toEqual([]);
  });

  it("should handle missing individual chunk embeddings safely", () => {
    const queryEmbedding = new Float32Array([1.0, 0.0, 0.0]);
    const sparseEmbeddings = [
      new Float32Array([0.9, 0.1, 0.0]),
      undefined as unknown as Float32Array,
      new Float32Array([0.0, 0.0, 0.9]),
    ];

    const matches = rankChunksBySimilarity(queryEmbedding, mockChunks, sparseEmbeddings, 5, 0.1);

    expect(matches.length).toBe(1);
    expect(matches[0].chunk.id).toBe("chunk-1");
  });
});
