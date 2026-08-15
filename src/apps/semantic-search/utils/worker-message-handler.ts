import { type ProgressInfo } from "@/components/ui/download-progress";

export type WorkerStatus =
  | "idle"
  | "initializing"
  | "loading"
  | "indexing"
  | "processing"
  | "complete"
  | "error";

export interface EmbeddingWorkerCallbacks {
  setStatus: (status: WorkerStatus) => void;
  setProgressItems: (
    updater: (prev: Record<string, ProgressInfo>) => Record<string, ProgressInfo>
  ) => void;
  setIndexingProgress?: (progress: { current: number; total: number; percentage: number }) => void;
  onReady?: () => void;
  onBatchEmbedComplete?: (embeddings: Float32Array[]) => void;
  onQueryEmbedComplete?: (embedding: Float32Array) => void;
  setErrorMsg: (msg: string) => void;
}

export const createEmbeddingWorkerMessageHandler = (callbacks: EmbeddingWorkerCallbacks) => {
  return (e: MessageEvent) => {
    const msg = e.data;

    switch (msg.type) {
      case "progress":
        callbacks.setStatus("loading");
        callbacks.setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
        break;
      case "ready":
        callbacks.setProgressItems(() => ({}));
        callbacks.setStatus("idle");
        callbacks.onReady?.();
        break;
      case "indexing_progress":
        callbacks.setStatus("indexing");
        callbacks.setIndexingProgress?.(msg.data);
        break;
      case "batch_embed_complete":
        callbacks.setStatus("complete");
        callbacks.onBatchEmbedComplete?.(msg.embeddings);
        break;
      case "query_embed_complete":
        callbacks.onQueryEmbedComplete?.(msg.embedding);
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setErrorMsg(msg.error || "An unexpected error occurred in embedding worker.");
        break;
    }
  };
};

export interface RAGWorkerCallbacks {
  setStatus: (status: WorkerStatus) => void;
  setProgressItems: (
    updater: (prev: Record<string, ProgressInfo>) => Record<string, ProgressInfo>
  ) => void;
  onUpdate: (chunk: string, tps?: number, numTokens?: number) => void;
  onComplete: (fullText: string) => void;
  setErrorMsg: (msg: string) => void;
}

export const createRAGWorkerMessageHandler = (callbacks: RAGWorkerCallbacks) => {
  return (e: MessageEvent) => {
    const msg = e.data;

    switch (msg.type) {
      case "progress":
        callbacks.setStatus("loading");
        callbacks.setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
        break;
      case "ready":
        callbacks.setProgressItems(() => ({}));
        callbacks.setStatus("idle");
        break;
      case "start":
        callbacks.setStatus("processing");
        break;
      case "update":
        callbacks.setStatus("processing");
        callbacks.onUpdate(msg.result, msg.tps, msg.numTokens);
        break;
      case "complete":
        callbacks.setStatus("complete");
        callbacks.onComplete(Array.isArray(msg.result) ? msg.result[0] : msg.result);
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setErrorMsg(msg.error || "An error occurred during answer generation.");
        break;
    }
  };
};
