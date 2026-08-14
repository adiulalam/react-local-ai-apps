import { createContext, useContext, useState, type ReactNode } from "react";
import type { DocumentChunk, ChunkingOptions } from "../utils/text-chunker";
import type { SearchMatch } from "../utils/similarity";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: number[];
  timestamp: number;
}

export interface SemanticSearchFormData {
  documentName: string;
  documentType: string;
  documentSize?: number;
  documentText: string;
  pageCount?: number;
  chunks: DocumentChunk[];
  chunkEmbeddings: Float32Array[];
  chunkingOptions: ChunkingOptions;
  searchQuery: string;
  searchResults: SearchMatch[];
  selectedChunkId: string | null;
  similarityThreshold: number;
  topK: number;
  chatMessages: ChatMessage[];
}

const defaultFormData: SemanticSearchFormData = {
  documentName: "",
  documentType: "text",
  documentText: "",
  chunks: [],
  chunkEmbeddings: [],
  chunkingOptions: {
    strategy: "paragraph",
    targetChunkWords: 120,
    overlapWords: 20,
    minChunkWords: 10,
  },
  searchQuery: "",
  searchResults: [],
  selectedChunkId: null,
  similarityThreshold: 0.2,
  topK: 4,
  chatMessages: [],
};

interface SemanticSearchContextType {
  activeStep: number;
  setActiveStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  formData: SemanticSearchFormData;
  setFormData: React.Dispatch<React.SetStateAction<SemanticSearchFormData>>;
  reset: () => void;
  highlightChunk: (chunkId: string | null) => void;
}

const SemanticSearchContext = createContext<SemanticSearchContextType | undefined>(undefined);

export const useSemanticSearchContext = () => {
  const context = useContext(SemanticSearchContext);
  if (!context) {
    throw new Error("useSemanticSearchContext must be used within a SemanticSearchProvider");
  }
  return context;
};

export const SemanticSearchProvider = ({ children }: { children: ReactNode }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<SemanticSearchFormData>(defaultFormData);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  const reset = () => {
    setActiveStep(1);
    setFormData(defaultFormData);
  };

  const highlightChunk = (chunkId: string | null) => {
    setFormData((prev) => ({ ...prev, selectedChunkId: chunkId }));
  };

  return (
    <SemanticSearchContext.Provider
      value={{
        activeStep,
        setActiveStep,
        nextStep,
        prevStep,
        formData,
        setFormData,
        reset,
        highlightChunk,
      }}
    >
      {children}
    </SemanticSearchContext.Provider>
  );
};
