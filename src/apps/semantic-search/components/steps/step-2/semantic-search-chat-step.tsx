import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Bot, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";
import { useRAGLLMContext } from "@/apps/semantic-search/context/rag-llm-context";
import { SAMPLE_DOCUMENTS } from "@/apps/semantic-search/utils/sample-documents";
import { IndexingStatusView } from "./indexing-status-view";
import { SearchHeaderBar } from "./search-header-bar";
import { DocumentViewerPane } from "./document-viewer-pane";
import { ChatAnswersPane } from "./chat-answers-pane";

export const SemanticSearchChatStep = () => {
  const { formData, setFormData, highlightChunk } = useSemanticSearchContext();
  const {
    status: embedStatus,
    progressItems,
    indexingProgress,
    error: embedError,
    startEmbedding,
    searchQuery,
    isSearching,
  } = useEmbeddingContext();

  const { tps, isGenerating, generateAnswer, interrupt } = useRAGLLMContext();

  const [activeTab, setActiveTab] = useState<string>("chat");
  const [inputQuery, setInputQuery] = useState(formData.searchQuery || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedChunk, setInspectedChunk] = useState<number | null>(null);
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isIndexed =
    formData.chunkEmbeddings.length > 0 &&
    formData.chunkEmbeddings.length === formData.chunks.length;
  const isIndexing = embedStatus === "loading" || embedStatus === "indexing";

  // Auto-start vector indexing upon entering step 2
  useEffect(() => {
    if (
      formData.chunks.length > 0 &&
      formData.chunkEmbeddings.length === 0 &&
      embedStatus === "idle"
    ) {
      startEmbedding(formData.chunks);
    }
  }, [formData.chunks, formData.chunkEmbeddings.length, embedStatus, startEmbedding]);

  // Suggested questions based on active document
  const matchedSample = SAMPLE_DOCUMENTS.find(
    (s) => s.name === formData.documentName || s.text === formData.documentText
  );
  const promptSuggestions = matchedSample?.sampleQueries || [
    "Summarize the key points of this document.",
    "What are the main findings or conclusions?",
    "Explain how the core process works.",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [formData.chatMessages, isGenerating]);

  const handleAskOrSearch = async (queryToRun?: string) => {
    const q = (queryToRun ?? inputQuery).trim();
    if (!q || isGenerating || isSearching) return;

    if (!queryToRun) {
      setInputQuery("");
    }

    setActiveTab("chat");
    const matches = await searchQuery(q);
    await generateAnswer(q, matches);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskOrSearch();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputQuery(suggestion);
    handleAskOrSearch(suggestion);
  };

  const scrollToChunk = (chunkId: string) => {
    setActiveTab("document");
    highlightChunk(chunkId);
    setTimeout(() => {
      const element = chunkRefs.current[chunkId];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setFormData((prev) => ({
      ...prev,
      chatMessages: [],
      searchResults: [],
      selectedChunkId: null,
      searchQuery: "",
    }));
    setInputQuery("");
    setInspectedChunk(null);
  };

  const handleExportMarkdown = () => {
    let md = `# Local Document Search & Q&A Report\n\n`;
    md += `**Document:** ${formData.documentName || "Document"}\n`;
    md += `**Date:** ${format(new Date(), "PPpp")}\n`;
    md += `**Total Chunks:** ${formData.chunks.length}\n\n---\n\n`;

    formData.chatMessages.forEach((msg) => {
      if (msg.role === "user") {
        md += `### Question / Search: ${msg.content}\n\n`;
      } else {
        md += `**AI Response:**\n${msg.content}\n\n`;
        if (msg.citations && msg.citations.length > 0) {
          md += `*Cited Sources:* ${msg.citations.map((c) => `[Chunk ${c}]`).join(", ")}\n\n`;
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.documentName || "document"}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If loading model weights or indexing chunks, render indexing status view
  if (!isIndexed || isIndexing) {
    return (
      <IndexingStatusView
        embedStatus={embedStatus}
        progressItems={progressItems}
        indexingProgress={indexingProgress}
        chunksCount={formData.chunks.length}
        embedError={embedError}
        onRetry={() => startEmbedding(formData.chunks)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SearchHeaderBar
        documentName={formData.documentName}
        chunksCount={formData.chunks.length}
        hasMessages={formData.chatMessages.length > 0}
        inputQuery={inputQuery}
        isGenerating={isGenerating}
        isSearching={isSearching}
        promptSuggestions={promptSuggestions}
        onInputChange={setInputQuery}
        onSubmit={handleSubmit}
        onSelectSuggestion={handleSelectSuggestion}
        onExport={handleExportMarkdown}
        onClear={handleClearHistory}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid h-10 w-full grid-cols-2 p-1">
          <TabsTrigger value="chat" className="gap-2 text-xs sm:text-sm">
            <Bot className="size-4" />
            <span>AI Answers & Verified Sources</span>
            {formData.chatMessages.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {formData.chatMessages.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="document" className="gap-2 text-xs sm:text-sm">
            <FileText className="size-4" />
            <span>Document Text & Live Highlights</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {formData.chunks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <ChatAnswersPane
            chatMessages={formData.chatMessages}
            searchResults={formData.searchResults}
            chunks={formData.chunks}
            isGenerating={isGenerating}
            tps={tps}
            copiedId={copiedId}
            inspectedChunk={inspectedChunk}
            messagesEndRef={messagesEndRef}
            onInterrupt={interrupt}
            onCopyMessage={handleCopyMessage}
            onInspectChunk={setInspectedChunk}
            onScrollToChunk={scrollToChunk}
          />
        </TabsContent>

        <TabsContent value="document" className="mt-0">
          <DocumentViewerPane
            chunks={formData.chunks}
            searchResults={formData.searchResults}
            selectedChunkId={formData.selectedChunkId}
            chunkRefs={chunkRefs}
            onChunkClick={scrollToChunk}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
