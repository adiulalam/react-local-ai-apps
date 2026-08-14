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
  streamingText: string;
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
  const [streamingText, setStreamingText] = useState("");
  const [tps, setTps] = useState<number | undefined>(undefined);
  const [numTokens, setNumTokens] = useState(0);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const currentQuestionRef = useRef<string>("");
  const currentCitationsRef = useRef<number[]>([]);

  useEffect(() => {
    workerRef.current = new RAGLLMWorker();

    const handler = createRAGWorkerMessageHandler({
      setStatus,
      setProgressItems,
      onUpdate: (chunk, currentTps, currentTokens) => {
        setStreamingText((prev) => prev + chunk);
        if (currentTps !== undefined) setTps(currentTps);
        if (currentTokens !== undefined) setNumTokens(currentTokens);
      },
      onComplete: (fullResult) => {
        setIsGenerating(false);
        const finalAnswer = fullResult || streamingText;
        const newAssistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: finalAnswer.trim(),
          citations: currentCitationsRef.current,
          timestamp: Date.now(),
        };

        setFormData((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, newAssistantMessage],
        }));

        setStreamingText("");
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
  }, [setFormData, streamingText]);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setStreamingText("");
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
    setStreamingText("");
    setIsGenerating(true);
    setTps(undefined);
    setNumTokens(0);
    currentQuestionRef.current = trimmedQuestion;

    const citationIndexes = relevantMatches.map((m) => m.chunk.index + 1);
    currentCitationsRef.current = citationIndexes;

    // Add user message to chat history
    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmedQuestion,
      timestamp: Date.now(),
    };

    setFormData((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newUserMessage],
    }));

    // Build context prompt
    const contextContent =
      relevantMatches.length > 0
        ? relevantMatches
            .map(
              (m) => `[Chunk ${m.chunk.index + 1} (${m.percentage}% relevance)]:\n${m.chunk.text}`
            )
            .join("\n\n")
        : "No relevant chunks found.";

    const systemPrompt = `You are a local AI assistant answering questions about a document using Retrieval-Augmented Generation (RAG).
Answer the user's question accurately and concisely based ONLY on the provided context chunks below.
When referencing specific facts, include the chunk citation in square brackets like [Chunk 1] or [Chunk 2].
If the context does not contain enough information to answer the question, state honestly: "Based on the provided document, there is not enough information to answer this question." Do not make up facts.

Document Context:
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
        streamingText,
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
