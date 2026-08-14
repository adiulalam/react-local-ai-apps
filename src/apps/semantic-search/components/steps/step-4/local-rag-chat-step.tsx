import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Download,
  RotateCcw,
  Square,
  ShieldCheck,
  BookOpen,
  Quote,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { H3, H4, Muted, P, Small } from "@/components/ui/typography";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";
import { useRAGLLMContext } from "@/apps/semantic-search/context/rag-llm-context";
import { SAMPLE_DOCUMENTS } from "@/apps/semantic-search/utils/sample-documents";

export const LocalRAGChatStep = () => {
  const { formData, setFormData } = useSemanticSearchContext();
  const { searchQuery } = useEmbeddingContext();
  const { streamingText, tps, isGenerating, generateAnswer, interrupt } = useRAGLLMContext();

  const [inputQuestion, setInputQuestion] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedChunk, setInspectedChunk] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested prompts
  const matchedSample = SAMPLE_DOCUMENTS.find(
    (s) => s.name === formData.documentName || s.text === formData.documentText
  );
  const promptSuggestions = matchedSample?.sampleQueries || [
    "Summarize the key insights from this document.",
    "What are the main advantages and challenges mentioned?",
    "Explain the primary mechanism described in the text.",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [formData.chatMessages, streamingText]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = inputQuestion.trim();
    if (!question || isGenerating) return;

    setInputQuestion("");
    // Ensure search query runs for this question to retrieve relevant chunks
    await searchQuery(question);
    // Trigger RAG answer with matching context
    await generateAnswer(question, formData.searchResults);
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isGenerating) return;
    setInputQuestion(prompt);
    await searchQuery(prompt);
    await generateAnswer(prompt, formData.searchResults);
    setInputQuestion("");
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setFormData((prev) => ({ ...prev, chatMessages: [] }));
    setInspectedChunk(null);
  };

  const handleExportMarkdown = () => {
    let md = `# Local Document RAG Q&A Report\n\n`;
    md += `**Document:** ${formData.documentName || "Document"}\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Total Chunks Indexed:** ${formData.chunks.length}\n\n---\n\n`;

    formData.chatMessages.forEach((msg) => {
      if (msg.role === "user") {
        md += `### Question: ${msg.content}\n\n`;
      } else {
        md += `**AI Answer:**\n${msg.content}\n\n`;
        if (msg.citations && msg.citations.length > 0) {
          md += `*Sources Cited:* ${msg.citations.map((c) => `[Chunk ${c}]`).join(", ")}\n\n`;
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.documentName || "document"}-rag-chat.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <H3>True Local RAG Document Chat</H3>
        <Muted>
          Ask questions about your document. The AI generates factual answers grounded strictly in
          the retrieved context with verifiable citations.
        </Muted>
      </div>

      {/* RAG Context Overview Bar */}
      <div className="bg-secondary/30 border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <BookOpen className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <H4 className="text-sm font-semibold">
                {formData.documentName || "Active Document"}
              </H4>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>Zero Cloud Leakage</span>
              </Badge>
            </div>
            <Muted className="text-xs">
              Grounded on {formData.chunks.length} local chunks • Top-{formData.topK} retrieved
              context
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
                className="h-8 gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                <span>Export Q&A</span>
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

      {/* Chat Thread Container */}
      <div className="border-border/70 bg-card flex max-h-[500px] min-h-[420px] flex-col rounded-xl border shadow-inner">
        {/* Messages List */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {formData.chatMessages.length === 0 && !streamingText && (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <Bot className="text-muted-foreground mb-3 size-10 opacity-30" />
              <H4 className="text-sm font-semibold">Start Document Conversation</H4>
              <P className="text-muted-foreground mt-1 max-w-md text-xs">
                Inquire about specific facts, summaries, or details. All answers are produced by
                your local model based exclusively on the document.
              </P>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {promptSuggestions.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectPrompt(prompt)}
                    className="h-7 rounded-full border-dashed text-xs"
                  >
                    <Sparkles className="text-primary mr-1 size-3" />
                    <span>{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {formData.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`group relative max-w-[82%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary/40 text-foreground border-border/50 border"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Citations list for assistant messages */}
                {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                  <div className="border-border/40 mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2">
                    <Small className="text-muted-foreground mr-1 text-[10px] font-medium">
                      Cited Passages:
                    </Small>
                    {msg.citations.map((cIndex) => (
                      <Button
                        key={cIndex}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setInspectedChunk(cIndex)}
                        className="h-5 rounded px-1.5 font-mono text-[10px]"
                      >
                        <Quote className="mr-1 size-2.5" />
                        Chunk #{cIndex}
                      </Button>
                    ))}
                  </div>
                )}

                {msg.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                    className="absolute top-2 right-2 size-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {copiedId === msg.id ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="text-muted-foreground size-3" />
                    )}
                  </Button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming Response Bubble */}
          {isGenerating && streamingText && (
            <div className="flex justify-start gap-3">
              <div className="bg-primary/10 text-primary flex size-8 shrink-0 animate-pulse items-center justify-center rounded-full">
                <Bot className="size-4" />
              </div>
              <div className="bg-secondary/40 text-foreground border-border/50 max-w-[82%] rounded-xl border p-3.5 text-xs leading-relaxed">
                <p className="whitespace-pre-line">{streamingText}</p>
                <div className="border-border/40 text-muted-foreground mt-2 flex items-center justify-between border-t pt-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    <Zap className="size-3 text-amber-500" />
                    <span>{tps ? `${tps.toFixed(1)} tokens/sec` : "Generating..."}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={interrupt}
                    className="text-destructive hover:bg-destructive/10 h-5 text-[10px]"
                  >
                    <Square className="mr-1 size-2.5" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Inspected Source Citation Drawer / Card */}
        {inspectedChunk !== null && (
          <div className="bg-muted/40 border-border/60 border-t p-3 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-foreground flex items-center gap-1.5 font-semibold">
                <Quote className="text-primary size-3" />
                <span>Verified Source: Chunk #{inspectedChunk}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectedChunk(null)}
                className="text-muted-foreground h-5 text-[10px]"
              >
                Close
              </Button>
            </div>
            <p className="text-muted-foreground line-clamp-3 font-mono text-[11px]">
              {formData.chunks[inspectedChunk - 1]?.text || "Source text not found."}
            </p>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="border-border/70 bg-background/80 border-t p-3"
        >
          <div className="flex gap-2">
            <Input
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a question about the document..."
              disabled={isGenerating}
              className="text-xs"
            />
            <Button
              type="submit"
              disabled={isGenerating || !inputQuestion.trim()}
              size="sm"
              className="shrink-0 gap-1.5 px-4"
            >
              {isGenerating ? (
                <Sparkles className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Ask</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
