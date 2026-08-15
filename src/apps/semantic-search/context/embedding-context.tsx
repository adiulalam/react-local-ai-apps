import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import EmbeddingWorker from "@/apps/semantic-search/workers/embedding.worker?worker";
import {
  createEmbeddingWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/semantic-search/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { useSemanticSearchContext } from "./semantic-search-context";
import { rankChunksBySimilarity, type SearchMatch } from "../utils/similarity";
import type { DocumentChunk } from "../utils/text-chunker";

interface IndexingProgress {
  current: number;
  total: number;
  percentage: number;
}

interface EmbeddingContextType {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  indexingProgress: IndexingProgress;
  error: string;
  isSearching: boolean;
  startEmbedding: (chunks: DocumentChunk[]) => Promise<Float32Array[]>;
  searchQuery: (query: string) => Promise<SearchMatch[]>;
  resetWorker: () => void;
}

const EmbeddingContext = createContext<EmbeddingContextType | undefined>(undefined);

export const useEmbeddingContext = () => {
  const context = useContext(EmbeddingContext);
  if (!context) {
    throw new Error("useEmbeddingContext must be used within an EmbeddingProvider");
  }
  return context;
};

export const EmbeddingProvider = ({ children }: { children: ReactNode }) => {
  const { formData, setFormData } = useSemanticSearchContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const resolveBatchEmbedRef = useRef<((embeddings: Float32Array[]) => void) | null>(null);
  const resolveQueryEmbedRef = useRef<((embedding: Float32Array) => void) | null>(null);

  useEffect(() => {
    workerRef.current = new EmbeddingWorker();

    const handler = createEmbeddingWorkerMessageHandler({
      setStatus,
      setProgressItems,
      setIndexingProgress,
      onBatchEmbedComplete: (embeddings) => {
        setFormData((prev) => ({ ...prev, chunkEmbeddings: embeddings }));
        if (resolveBatchEmbedRef.current) {
          resolveBatchEmbedRef.current(embeddings);
          resolveBatchEmbedRef.current = null;
        }
      },
      onQueryEmbedComplete: (embedding) => {
        if (resolveQueryEmbedRef.current) {
          resolveQueryEmbedRef.current(embedding);
          resolveQueryEmbedRef.current = null;
        }
      },
      setErrorMsg: setError,
    });

    workerRef.current.addEventListener("message", handler);

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [setFormData]);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setIndexingProgress({ current: 0, total: 0, percentage: 0 });
    setError("");
    setIsSearching(false);
  };

  const startEmbedding = (chunks: DocumentChunk[]): Promise<Float32Array[]> => {
    setError("");
    setStatus("loading");
    setProgressItems({});
    setIndexingProgress({ current: 0, total: chunks.length, percentage: 0 });

    return new Promise((resolve) => {
      resolveBatchEmbedRef.current = resolve;
      workerRef.current?.postMessage({
        type: "batch_embed",
        chunks: chunks.map((c) => c.text),
      });
    });
  };

  const searchQuery = async (query: string): Promise<SearchMatch[]> => {
    const trimmed = query.trim();
    if (!trimmed) {
      setFormData((prev) => ({ ...prev, searchQuery: "", searchResults: [] }));
      return [];
    }

    setIsSearching(true);
    setError("");
    setFormData((prev) => ({ ...prev, searchQuery: trimmed }));

    try {
      const queryEmbedding = await new Promise<Float32Array>((resolve) => {
        resolveQueryEmbedRef.current = resolve;
        workerRef.current?.postMessage({
          type: "query_embed",
          query: trimmed,
        });
      });

      const matches = rankChunksBySimilarity(
        queryEmbedding,
        formData.chunks,
        formData.chunkEmbeddings,
        formData.topK,
        formData.similarityThreshold
      );

      setFormData((prev) => ({
        ...prev,
        searchResults: matches,
        selectedChunkId: matches.length > 0 ? matches[0].chunk.id : null,
      }));

      return matches;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute semantic search");
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <EmbeddingContext.Provider
      value={{
        status,
        progressItems,
        indexingProgress,
        error,
        isSearching,
        startEmbedding,
        searchQuery,
        resetWorker,
      }}
    >
      {children}
    </EmbeddingContext.Provider>
  );
};
