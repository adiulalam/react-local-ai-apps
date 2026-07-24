import "katex/dist/katex.min.css";
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Bot, User, Brain, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  answerIndex?: number;
  isReasoning?: boolean;
}

const processMath = (text: string) => {
  return text
    .replaceAll("\\[", "$$")
    .replaceAll("\\]", "$$")
    .replaceAll("\\(", "$")
    .replaceAll("\\)", "$");
};

export const ChatMessage = ({
  role,
  content,
  answerIndex,
  isReasoning = true,
}: ChatMessageProps) => {
  const { thinking, answer } = useMemo(() => {
    if (!isReasoning) {
      return { thinking: "", answer: content };
    }

    const thinkingRaw = answerIndex !== undefined ? content.slice(0, answerIndex) : content;
    const t = thinkingRaw
      .replace(/<think>/g, "")
      .replace(/<\/think>/g, "")
      .trim();

    const answerRaw = answerIndex !== undefined ? content.slice(answerIndex) : "";
    const a = answerRaw
      .replace(/<think>/g, "")
      .replace(/<\/think>/g, "")
      .trimStart();

    return { thinking: t, answer: a };
  }, [content, answerIndex, isReasoning]);

  const [showThinking, setShowThinking] = useState(false);
  const doneThinking = answerIndex !== undefined && answerIndex >= 0;

  return (
    <div
      className={cn(
        "mb-4 flex w-full items-start gap-4",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="mt-1">
        <AvatarFallback
          className={
            role === "assistant"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }
        >
          {role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          role === "user" ? "items-end" : "items-start"
        )}
      >
        {role === "assistant" ? (
          <Card data-testid="assistant-message" className="bg-muted/50 border-none shadow-none">
            <CardContent className="text-sm whitespace-pre-wrap">
              {answerIndex !== undefined || thinking.length > 0 || !isReasoning ? (
                <>
                  {thinking.length > 0 && (
                    <div className="bg-background mb-2 flex flex-col overflow-hidden rounded-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-muted/50 flex w-full items-center justify-between rounded-none"
                        onClick={() => setShowThinking((prev) => !prev)}
                      >
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          <span>{doneThinking ? "View reasoning" : "Thinking..."}</span>
                        </div>
                        {showThinking ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {showThinking && (
                        <div className="bg-muted/20 prose prose-sm dark:prose-invert border-t p-4 pt-4">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {processMath(thinking)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                  {(doneThinking || !isReasoning) && (
                    <div className="prose prose-sm dark:prose-invert text-foreground prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {processMath(answer)}
                      </ReactMarkdown>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-6 items-center gap-1">
                  <MoreHorizontal className="text-foreground/40 h-5 w-5" />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};
