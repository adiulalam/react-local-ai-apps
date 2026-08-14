import { SemanticSearchStepper } from "@/apps/semantic-search/components/semantic-search-stepper";
import { SemanticSearchProvider } from "@/apps/semantic-search/context/semantic-search-context";
import { EmbeddingProvider } from "@/apps/semantic-search/context/embedding-context";
import { RAGLLMProvider } from "@/apps/semantic-search/context/rag-llm-context";

const SemanticSearchScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center px-4 py-10">
      <SemanticSearchProvider>
        <EmbeddingProvider>
          <RAGLLMProvider>
            <SemanticSearchStepper />
          </RAGLLMProvider>
        </EmbeddingProvider>
      </SemanticSearchProvider>
    </div>
  );
};

export default SemanticSearchScreen;
