import "katex/dist/katex.min.css";
import { type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Bot, User, Copy, Check, Quote, Sparkles, Zap, Square, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { H4, P, Small } from "@/components/ui/typography";
import type { ChatMessage } from "@/apps/semantic-search/context/semantic-search-context";
import type { SearchMatch } from "@/apps/semantic-search/utils/similarity";
import type { DocumentChunk } from "@/apps/semantic-search/utils/text-chunker";

interface ChatAnswersPaneProps {
  chatMessages: ChatMessage[];
  searchResults: SearchMatch[];
  chunks: DocumentChunk[];
  isGenerating: boolean;
  tps: number | undefined;
  copiedId: string | null;
  inspectedChunk: number | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInterrupt: () => void;
  onCopyMessage: (content: string, id: string) => void;
  onInspectChunk: (chunkIndex: number | null) => void;
  onScrollToChunk: (chunkId: string) => void;
}

export const ChatAnswersPane = ({
  chatMessages,
  searchResults,
  chunks,
  isGenerating,
  tps,
  copiedId,
  inspectedChunk,
  messagesEndRef,
  onInterrupt,
  onCopyMessage,
  onInspectChunk,
  onScrollToChunk,
}: ChatAnswersPaneProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Small className="text-xs font-semibold">AI Answers & Verified Sources</Small>
        {searchResults.length > 0 && (
          <Badge variant="outline" className="text-[10px]">
            {searchResults.length} relevant sources found
          </Badge>
        )}
      </div>

      <div className="border-border/70 bg-card flex max-h-[680px] min-h-[520px] flex-col rounded-xl border p-4 shadow-inner">
        {/* Conversation Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {chatMessages.length === 0 && (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center py-12 text-center">
              <Bot className="text-muted-foreground mb-3 size-10 opacity-30" />
              <H4 className="text-sm font-semibold">Ready to Search & Answer</H4>
              <P className="text-muted-foreground mt-1.5 max-w-md text-xs sm:text-sm">
                Type a question or select a suggestion above. The AI answers strictly using the
                document passages and cites exact source chunks.
              </P>
            </div>
          )}

          {chatMessages.map((msg, index) => {
            const isLatestAssistant =
              isGenerating && index === chatMessages.length - 1 && msg.role === "assistant";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className={`bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full ${
                      isLatestAssistant ? "animate-pulse" : ""
                    }`}
                  >
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground text-xs font-medium sm:text-sm"
                      : "bg-secondary/40 text-foreground border-border/50 border text-xs sm:text-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <div className="prose prose-sm dark:prose-invert text-foreground prose-p:my-1.5 prose-p:leading-relaxed prose-headings:my-2 prose-headings:font-semibold prose-ul:my-1.5 prose-ul:pl-4 prose-ol:my-1.5 prose-ol:pl-4 prose-li:my-0.5 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] sm:prose-code:text-xs prose-pre:bg-muted prose-pre:border prose-pre:p-3 prose-pre:rounded-lg max-w-none text-xs leading-relaxed sm:text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : isLatestAssistant ? (
                      <div className="text-muted-foreground flex items-center gap-2 py-1">
                        <Sparkles className="text-primary size-3.5 animate-spin" />
                        <span>Analyzing document and generating answer...</span>
                      </div>
                    ) : null
                  ) : (
                    <p className="whitespace-pre-line">{msg.content}</p>
                  )}

                  {/* Citations list for assistant messages */}
                  {msg.role === "assistant" &&
                    msg.citations &&
                    msg.citations.length > 0 &&
                    !isLatestAssistant && (
                      <div className="border-border/40 mt-3 flex flex-wrap items-center gap-1.5 border-t pt-2">
                        <Small className="text-muted-foreground mr-1 text-[11px] font-medium">
                          Sources:
                        </Small>
                        {msg.citations.map((cIndex) => (
                          <Button
                            key={cIndex}
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              onInspectChunk(cIndex);
                              onScrollToChunk(String(cIndex - 1));
                            }}
                            className="h-5 rounded px-2 font-mono text-[10px]"
                          >
                            <Quote className="mr-1 size-2.5" />
                            Chunk #{cIndex}
                          </Button>
                        ))}
                      </div>
                    )}

                  {/* Streaming speed & Stop button for active generating message */}
                  {isLatestAssistant && (
                    <div className="border-border/40 text-muted-foreground mt-2.5 flex items-center justify-between border-t pt-2 text-[10px]">
                      <div className="flex items-center gap-1">
                        <Zap className="size-3 text-amber-500" />
                        <span>{tps ? `${tps.toFixed(1)} tokens/s` : "Generating..."}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onInterrupt}
                        className="text-destructive hover:bg-destructive/10 h-5 text-[10px]"
                      >
                        <Square className="mr-1 size-2.5" />
                        Stop
                      </Button>
                    </div>
                  )}

                  {/* Copy button for completed assistant messages */}
                  {msg.role === "assistant" && !isLatestAssistant && msg.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyMessage(msg.content, msg.id)}
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
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Inspected Source Excerpt Preview */}
        {inspectedChunk !== null && (
          <div className="bg-muted/40 border-border/60 mt-3 rounded-lg border p-3 text-xs">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Quote className="text-primary size-3" />
                <span>Source Excerpt: Chunk #{inspectedChunk}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInspectChunk(null)}
                className="text-muted-foreground h-5 p-0 text-[11px]"
              >
                Close
              </Button>
            </div>
            <p className="text-muted-foreground line-clamp-3 font-mono text-[11px] leading-relaxed">
              {chunks[inspectedChunk - 1]?.text || "Source excerpt"}
            </p>
          </div>
        )}

        {/* Top Matches Preview Drawer */}
        {searchResults.length > 0 && (
          <div className="border-border/40 mt-3 border-t pt-2.5">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
              <span>Top Ranked Matches:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchResults.slice(0, 4).map((match) => (
                <Button
                  key={match.chunk.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onScrollToChunk(match.chunk.id)}
                  className="h-7 rounded-md px-2.5 text-xs"
                >
                  <span className="mr-1 font-semibold">#{match.rank}</span>
                  <span>Chunk {match.chunk.index + 1}</span>
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 font-mono text-[10px]">
                    {match.percentage}%
                  </Badge>
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
