import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import RAGLLMWorker from "@/apps/semantic-search/workers/rag-llm.worker?worker";
import {
  createRAGWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/semantic-search/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { useSemanticSearchContext, type ChatMessage } from "./semantic-search-context";
import type { SearchMatch } from "../utils/similarity";

interface RAGLLMContextType {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  tps: number | undefined;
  numTokens: number;
  error: string;
  isGenerating: boolean;
  generateAnswer: (question: string, relevantMatches: SearchMatch[]) => Promise<void>;
  interrupt: () => void;
  resetWorker: () => void;
}

const RAGLLMContext = createContext<RAGLLMContextType | undefined>(undefined);

export const useRAGLLMContext = () => {
  const context = useContext(RAGLLMContext);
  if (!context) {
    throw new Error("useRAGLLMContext must be used within a RAGLLMProvider");
  }
  return context;
};

export const RAGLLMProvider = ({ children }: { children: ReactNode }) => {
  const { setFormData } = useSemanticSearchContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [tps, setTps] = useState<number | undefined>(undefined);
  const [numTokens, setNumTokens] = useState(0);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new RAGLLMWorker();
    workerRef.current.postMessage({ type: "check" });

    const handler = createRAGWorkerMessageHandler({
      setStatus,
      setProgressItems,
      onUpdate: (chunk, currentTps, currentTokens) => {
        if (currentTps !== undefined) setTps(currentTps);
        if (currentTokens !== undefined) setNumTokens(currentTokens);

        setFormData((prev) => {
          const msgs = [...prev.chatMessages];
          if (msgs.length === 0) return prev;
          const lastIndex = msgs.length - 1;
          const lastMsg = msgs[lastIndex];
          if (lastMsg && lastMsg.role === "assistant") {
            msgs[lastIndex] = {
              ...lastMsg,
              content: lastMsg.content + (chunk || ""),
            };
          }
          return { ...prev, chatMessages: msgs };
        });
      },
      onComplete: () => {
        setIsGenerating(false);
      },
      setErrorMsg: (errMsg) => {
        setIsGenerating(false);
        setError(errMsg);
      },
    });

    workerRef.current.addEventListener("message", handler);

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [setFormData]);

  const resetWorker = () => {
    workerRef.current?.postMessage({ type: "reset" });
    setStatus("idle");
    setProgressItems({});
    setTps(undefined);
    setNumTokens(0);
    setError("");
    setIsGenerating(false);
  };

  const interrupt = () => {
    workerRef.current?.postMessage({ type: "interrupt" });
    setIsGenerating(false);
  };

  const generateAnswer = async (question: string, relevantMatches: SearchMatch[]) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setError("");
    setIsGenerating(true);
    setTps(undefined);
    setNumTokens(0);

    const citationIndexes = relevantMatches.map((m) => m.chunk.index + 1);

    // 1. Append user message and an initial empty assistant message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmedQuestion,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: "",
      citations: citationIndexes,
      timestamp: Date.now(),
    };

    setFormData((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMsg, assistantMsg],
    }));

    // 2. Build structured document context for RAG
    const contextContent =
      relevantMatches.length > 0
        ? relevantMatches
            .map(
              (m) =>
                `--- Document Passage [Chunk ${m.chunk.index + 1}] (${m.percentage}% match) ---\n${m.chunk.text}`
            )
            .join("\n\n")
        : "No direct matching document passages found.";

    const systemPrompt = `You are a helpful and accurate local AI research assistant.
Answer the user's question clearly, thoroughly, and factually using ONLY the provided document passages.
Cite the relevant passage numbers like [Chunk 1] or [Chunk 2] when referencing facts from the text.
Use formatting (bullet points, clear paragraphs) to make your answer easy to read.
If the provided document does not contain enough information to answer the question, state: "Based on the provided document, there is not enough information to answer this question."

Document Passages:
${contextContent}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: trimmedQuestion },
    ];

    workerRef.current?.postMessage({
      type: "generate",
      data: { messages },
    });
  };

  return (
    <RAGLLMContext.Provider
      value={{
        status,
        progressItems,
        tps,
        numTokens,
        error,
        isGenerating,
        generateAnswer,
        interrupt,
        resetWorker,
      }}
    >
      {children}
    </RAGLLMContext.Provider>
  );
};
