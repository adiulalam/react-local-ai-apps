import type { DocumentChunk } from "./text-chunker";

export interface SearchMatch {
  chunk: DocumentChunk;
  score: number; // 0 to 1
  percentage: number; // 0 to 100
  rank: number;
}

export const cosineSimilarity = (
  vecA: Float32Array | number[],
  vecB: Float32Array | number[]
): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
};

export const rankChunksBySimilarity = (
  queryEmbedding: Float32Array | number[],
  chunks: DocumentChunk[],
  chunkEmbeddings: (Float32Array | number[])[],
  topK = 5,
  minThreshold = 0.15
): SearchMatch[] => {
  if (!queryEmbedding || chunks.length === 0 || chunkEmbeddings.length === 0) {
    return [];
  }

  const scoredChunks: { chunk: DocumentChunk; score: number }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = chunkEmbeddings[i];
    if (!embedding) continue;

    const score = cosineSimilarity(queryEmbedding, embedding);
    if (score >= minThreshold) {
      scoredChunks.push({ chunk, score });
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map((item, idx) => ({
    chunk: item.chunk,
    score: item.score,
    percentage: Math.round(item.score * 100),
    rank: idx + 1,
  }));
};
