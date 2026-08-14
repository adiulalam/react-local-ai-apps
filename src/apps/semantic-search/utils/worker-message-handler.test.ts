import { describe, it, expect, vi } from "vitest";
import {
  createEmbeddingWorkerMessageHandler,
  createRAGWorkerMessageHandler,
} from "./worker-message-handler";

describe("semantic-search worker-message-handler", () => {
  describe("createEmbeddingWorkerMessageHandler", () => {
    it("should handle progress, ready, indexing, batch_embed_complete, and error messages", () => {
      const setStatus = vi.fn();
      const setProgressItems = vi.fn();
      const setIndexingProgress = vi.fn();
      const onReady = vi.fn();
      const onBatchEmbedComplete = vi.fn();
      const onQueryEmbedComplete = vi.fn();
      const setErrorMsg = vi.fn();

      const handler = createEmbeddingWorkerMessageHandler({
        setStatus,
        setProgressItems,
        setIndexingProgress,
        onReady,
        onBatchEmbedComplete,
        onQueryEmbedComplete,
        setErrorMsg,
      });

      // Progress message
      handler({
        data: {
          type: "progress",
          data: { file: "model.onnx", progress: 50, loaded: 500, total: 1000, status: "progress" },
        },
      } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("loading");

      // Ready message
      handler({ data: { type: "ready" } } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("idle");
      expect(onReady).toHaveBeenCalled();

      // Indexing progress
      handler({
        data: { type: "indexing_progress", data: { current: 3, total: 10, percentage: 30 } },
      } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("indexing");
      expect(setIndexingProgress).toHaveBeenCalledWith({ current: 3, total: 10, percentage: 30 });

      // Batch embed complete
      const mockEmbeddings = [new Float32Array([0.1, 0.2])];
      handler({
        data: { type: "batch_embed_complete", embeddings: mockEmbeddings },
      } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("complete");
      expect(onBatchEmbedComplete).toHaveBeenCalledWith(mockEmbeddings);

      // Query embed complete
      const mockQueryEmbedding = new Float32Array([0.3, 0.4]);
      handler({
        data: { type: "query_embed_complete", embedding: mockQueryEmbedding },
      } as MessageEvent);
      expect(onQueryEmbedComplete).toHaveBeenCalledWith(mockQueryEmbedding);

      // Error message
      handler({
        data: { type: "error", error: "Test model error" },
      } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("error");
      expect(setErrorMsg).toHaveBeenCalledWith("Test model error");
    });
  });

  describe("createRAGWorkerMessageHandler", () => {
    it("should handle update and complete messages", () => {
      const setStatus = vi.fn();
      const setProgressItems = vi.fn();
      const onUpdate = vi.fn();
      const onComplete = vi.fn();
      const setErrorMsg = vi.fn();

      const handler = createRAGWorkerMessageHandler({
        setStatus,
        setProgressItems,
        onUpdate,
        onComplete,
        setErrorMsg,
      });

      handler({ data: { type: "start" } } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("processing");

      handler({
        data: { type: "update", result: "Generated answer token", tps: 25.5, numTokens: 10 },
      } as MessageEvent);
      expect(onUpdate).toHaveBeenCalledWith("Generated answer token", 25.5, 10);

      handler({
        data: { type: "complete", result: ["Final answer from document"] },
      } as MessageEvent);
      expect(setStatus).toHaveBeenCalledWith("complete");
      expect(onComplete).toHaveBeenCalledWith("Final answer from document");
    });
  });
});
