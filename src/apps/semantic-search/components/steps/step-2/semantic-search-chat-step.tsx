import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Download,
  RotateCcw,
  Square,
  ShieldCheck,
  FileText,
  Quote,
  Target,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { H3, H4, Muted, P, Small } from "@/components/ui/typography";
import { DownloadProgress } from "@/components/ui/download-progress";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";
import { useRAGLLMContext } from "@/apps/semantic-search/context/rag-llm-context";
import { SAMPLE_DOCUMENTS } from "@/apps/semantic-search/utils/sample-documents";

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

  // Suggested questions
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

    // 1. Run semantic vector search to find and highlight matching chunks
    const matches = await searchQuery(q);

    // 2. Trigger local AI RAG answer generation with the retrieved context
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
    highlightChunk(chunkId);
    const element = chunkRefs.current[chunkId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
    md += `**Date:** ${new Date().toLocaleString()}\n`;
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

  // If indexing or loading model, display clean progress view
  if (!isIndexed || isIndexing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <H3>Preparing Offline AI & Indexing Document</H3>
          <Muted>
            Analyzing text and creating vector embeddings directly in your browser memory.
          </Muted>
        </div>

        {embedStatus === "loading" && Object.keys(progressItems).length > 0 && (
          <div className="bg-secondary/30 border-border/60 rounded-xl border p-4">
            <DownloadProgress progressItems={progressItems} />
          </div>
        )}

        {embedStatus === "indexing" && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary size-4 animate-spin" />
                  <span>Indexing {formData.chunks.length} document sections...</span>
                </div>
                <span className="font-mono text-xs">{indexingProgress.percentage}%</span>
              </div>
              <Progress value={indexingProgress.percentage} className="h-2" />
            </CardContent>
          </Card>
        )}

        {embedError && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm">
            <span>{embedError}</span>
            <Button variant="outline" size="sm" onClick={() => startEmbedding(formData.chunks)}>
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Document Header Bar */}
      <div className="bg-secondary/30 border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <FileText className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <H4 className="text-sm font-semibold">{formData.documentName || "Document"}</H4>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>100% Offline</span>
              </Badge>
            </div>
            <Muted className="text-xs">
              {formData.chunks.length} sections indexed • Ready for search & Q&A
            </Muted>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {formData.chatMessages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMarkdown}
                className="h-8 gap-1 text-xs"
              >
                <Download className="size-3.5" />
                <span>Export Report</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-foreground h-8 text-xs"
              >
                <RotateCcw className="mr-1 size-3.5" />
                <span>Clear</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Search & Question Bar */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything or search passages (e.g. 'What are the main key points?')..."
              className="pl-9 text-sm"
              disabled={isGenerating}
            />
          </div>
          <Button
            type="submit"
            disabled={isGenerating || isSearching || !inputQuery.trim()}
            className="shrink-0 gap-1.5 px-4"
          >
            {isGenerating || isSearching ? (
              <Sparkles className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span>Ask AI</span>
          </Button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Small className="text-muted-foreground mr-1 text-[11px] font-medium">Try asking:</Small>
          {promptSuggestions.map((query) => (
            <Button
              key={query}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectSuggestion(query)}
              disabled={isGenerating}
              className="h-6 rounded-full border-dashed px-2.5 text-[11px]"
            >
              <Sparkles className="text-primary mr-1 size-2.5" />
              <span className="max-w-xs truncate">{query}</span>
            </Button>
          ))}
        </div>
      </form>

      {/* Split-Screen Workspace: Document Viewer (Left) & Q&A / Ranked Matches (Right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Interactive Document Reader with Highlights (6 cols) */}
        <div className="space-y-2 lg:col-span-6">
          <div className="flex items-center justify-between">
            <Small className="text-xs font-semibold">Document Text & Live Highlights</Small>
            <Badge variant="secondary" className="text-[10px]">
              {formData.chunks.length} sections
            </Badge>
          </div>

          <div className="border-border/70 bg-card max-h-[500px] space-y-3 overflow-y-auto rounded-xl border p-3.5 shadow-inner">
            {formData.chunks.map((chunk) => {
              const match = formData.searchResults.find((m) => m.chunk.id === chunk.id);
              const isSelected = formData.selectedChunkId === chunk.id;
              const isMatch = Boolean(match);

              let matchBg = "bg-secondary/20 border-border/50";
              if (isMatch) {
                matchBg =
                  match!.score > 0.6
                    ? "bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/30"
                    : "bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30";
              }
              if (isSelected) {
                matchBg += " ring-2 ring-primary border-primary shadow-xs";
              }

              return (
                <div
                  key={chunk.id}
                  ref={(el) => {
                    chunkRefs.current[chunk.id] = el;
                  }}
                  onClick={() => highlightChunk(chunk.id)}
                  className={`relative cursor-pointer rounded-lg border p-3 transition-all ${matchBg}`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Chunk #{chunk.index + 1}
                    </Badge>

                    {isMatch && (
                      <Badge
                        variant={match!.score > 0.6 ? "default" : "secondary"}
                        className="gap-1 text-[10px] font-semibold"
                      >
                        <Target className="size-2.5" />
                        <span>{match!.percentage}% Match</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-foreground font-sans text-xs leading-relaxed whitespace-pre-line">
                    {chunk.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Answers & Matching Context (6 cols) */}
        <div className="space-y-3 lg:col-span-6">
          <div className="flex items-center justify-between">
            <Small className="text-xs font-semibold">AI Answers & Verified Sources</Small>
            {formData.searchResults.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {formData.searchResults.length} relevant sources found
              </Badge>
            )}
          </div>

          <div className="border-border/70 bg-card flex max-h-[500px] min-h-[420px] flex-col rounded-xl border p-3 shadow-inner">
            {/* Conversation Flow */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {formData.chatMessages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <Bot className="text-muted-foreground mb-2 size-8 opacity-30" />
                  <H4 className="text-xs font-semibold">Ready to Search & Answer</H4>
                  <P className="text-muted-foreground mt-1 max-w-xs text-xs">
                    Type a question or select a suggestion above. The AI answers strictly using the
                    document passages.
                  </P>
                </div>
              )}

              {formData.chatMessages.map((msg, index) => {
                const isLatestAssistant =
                  isGenerating &&
                  index === formData.chatMessages.length - 1 &&
                  msg.role === "assistant";

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className={`bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full ${
                          isLatestAssistant ? "animate-pulse" : ""
                        }`}
                      >
                        <Bot className="size-3.5" />
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-secondary/40 text-foreground border-border/50 border"
                      }`}
                    >
                      {msg.content ? (
                        <p className="whitespace-pre-line">{msg.content}</p>
                      ) : isLatestAssistant ? (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Sparkles className="text-primary size-3 animate-spin" />
                          <span>Analyzing document and generating answer...</span>
                        </div>
                      ) : null}

                      {/* Citations list for assistant messages */}
                      {msg.role === "assistant" &&
                        msg.citations &&
                        msg.citations.length > 0 &&
                        !isLatestAssistant && (
                          <div className="border-border/40 mt-2 flex flex-wrap items-center gap-1 border-t pt-1.5">
                            <Small className="text-muted-foreground mr-1 text-[10px] font-medium">
                              Sources:
                            </Small>
                            {msg.citations.map((cIndex) => (
                              <Button
                                key={cIndex}
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setInspectedChunk(cIndex);
                                  scrollToChunk(String(cIndex - 1));
                                }}
                                className="h-4.5 rounded px-1.5 font-mono text-[10px]"
                              >
                                <Quote className="mr-1 size-2" />
                                Chunk #{cIndex}
                              </Button>
                            ))}
                          </div>
                        )}

                      {/* Streaming stats / Stop button for active generating message */}
                      {isLatestAssistant && (
                        <div className="border-border/40 text-muted-foreground mt-2 flex items-center justify-between border-t pt-1.5 text-[10px]">
                          <div className="flex items-center gap-1">
                            <Zap className="size-2.5 text-amber-500" />
                            <span>{tps ? `${tps.toFixed(1)} tokens/s` : "Generating..."}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={interrupt}
                            className="text-destructive hover:bg-destructive/10 h-4.5 text-[10px]"
                          >
                            <Square className="mr-1 size-2" />
                            Stop
                          </Button>
                        </div>
                      )}

                      {/* Copy button for completed assistant messages */}
                      {msg.role === "assistant" && !isLatestAssistant && msg.content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="absolute top-1.5 right-1.5 size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {copiedId === msg.id ? (
                            <Check className="size-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="text-muted-foreground size-2.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                        <User className="size-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Inspected Source Preview */}
            {inspectedChunk !== null && (
              <div className="bg-muted/40 border-border/60 mt-2 rounded-lg border p-2.5 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-foreground flex items-center gap-1 text-[11px] font-semibold">
                    <Quote className="text-primary size-2.5" />
                    <span>Source Excerpt: Chunk #{inspectedChunk}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectedChunk(null)}
                    className="text-muted-foreground h-4 p-0 text-[10px]"
                  >
                    Close
                  </Button>
                </div>
                <p className="text-muted-foreground line-clamp-3 font-mono text-[10px] leading-relaxed">
                  {formData.chunks[inspectedChunk - 1]?.text || "Source excerpt"}
                </p>
              </div>
            )}

            {/* Top Matches Preview Drawer */}
            {formData.searchResults.length > 0 && (
              <div className="border-border/40 mt-2 border-t pt-2">
                <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[11px] font-medium">
                  <span>Top Ranked Matches:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.searchResults.slice(0, 3).map((match) => (
                    <Button
                      key={match.chunk.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => scrollToChunk(match.chunk.id)}
                      className="h-6 rounded px-2 text-[10px]"
                    >
                      <span className="mr-1 font-semibold">#{match.rank}</span>
                      <span>Chunk {match.chunk.index + 1}</span>
                      <Badge variant="secondary" className="ml-1 px-1 py-0 font-mono text-[9px]">
                        {match.percentage}%
                      </Badge>
                      <ChevronRight className="ml-0.5 size-2.5" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
