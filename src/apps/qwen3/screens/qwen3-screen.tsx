import { useEffect, useState, useRef } from "react";
import { ChatMessage, ChatInput, ChatProgress, type ProgressItem } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Play, RefreshCw } from "lucide-react";
import { Qwen } from "@/components/icons/qwen";
import { H1, Muted, Large, Small } from "@/components/ui/typography";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/qwen3/utils/worker-message-handler";
import { cn } from "@/lib/utils";
import QwenWorker from "@/apps/qwen3/workers/qwen.worker?worker";

const IS_WEBGPU_AVAILABLE = !!navigator.gpu;

interface Message {
  role: "user" | "assistant";
  content: string;
  answerIndex?: number;
}

const Qwen3Screen = () => {
  const worker = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const [reasonEnabled, setReasonEnabled] = useState(false);

  const onSend = (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setTps(null);
    setIsRunning(true);
  };

  const onInterrupt = () => {
    worker.current?.postMessage({ type: "interrupt" });
  };

  useEffect(() => {
    if (!worker.current) {
      worker.current = new QwenWorker();
      worker.current.postMessage({ type: "check" });
    }

    const onMessageReceived = createWorkerMessageHandler({
      setStatus,
      setLoadingMessage,
      setProgressItems,
      setErrorMsg: setError,
      onReady: () => {},
      onStart: () => setMessages((prev) => [...prev, { role: "assistant", content: "" }]),
      onUpdate: (output, newTps, newNumTokens, state) => {
        setTps(newTps ?? null);
        setNumTokens(newNumTokens);
        setMessages((prev) => {
          const cloned = [...prev];
          const last = cloned[cloned.length - 1];
          const data: Message = { ...last, content: last.content + output };
          if (data.answerIndex === undefined && state === "answering") {
            data.answerIndex = last.content.length;
          }
          cloned[cloned.length - 1] = data;
          return cloned;
        });
      },
      onComplete: () => setIsRunning(false),
    });

    worker.current.addEventListener("message", onMessageReceived);
    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, []);

  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) return;
    if (messages[messages.length - 1].role === "assistant") return;
    worker.current?.postMessage({
      type: "generate",
      data: { messages, reasonEnabled },
    });
  }, [messages, reasonEnabled, isRunning]);

  useEffect(() => {
    if (isRunning) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isRunning]);

  if (!IS_WEBGPU_AVAILABLE) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <Card className="bg-destructive/10 border-destructive w-full max-w-md">
          <CardContent className="text-destructive pt-6 text-center">
            <Large>WebGPU is not supported</Large>
            <Muted className="text-destructive/80 mt-2">
              Please use a browser that supports WebGPU to run this model locally.
            </Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-80px)] w-full max-w-4xl flex-col px-4 py-6">
      {(status === "idle" || status === "error") && messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center space-y-6">
          <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <Qwen className="text-primary h-10 w-10" />
          </div>
          <H1 className="text-3xl">Qwen 3 - 0.6B</H1>
          <Muted className="max-w-lg text-center text-base">
            A hybrid reasoning model that runs locally in your browser with WebGPU acceleration.
            Everything runs entirely on your device, meaning no data is sent to a server.
          </Muted>
          {error && (
            <Small className="text-destructive bg-destructive/10 block w-full max-w-md rounded-lg p-3 text-center">
              {error}
            </Small>
          )}
          <Button
            size="lg"
            onClick={() => {
              worker.current?.postMessage({ type: "load" });
              setStatus("loading");
            }}
            disabled={error !== null}
          >
            <Play className="mr-2 h-4 w-4" />
            Start Model
          </Button>
        </div>
      )}

      {status === "loading" && (
        <div className="flex h-full flex-col items-center justify-center">
          <ChatProgress message={loadingMessage} items={progressItems} />
        </div>
      )}

      {(status === "ready" || status === "processing" || status === "complete") && (
        <>
          <ScrollArea className="w-full flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
                <H1 className="sr-only">Qwen 3 - 0.6B</H1>
                <Qwen className="text-muted-foreground h-16 w-16 opacity-20" />
                <Muted>Model loaded! Start chatting below.</Muted>
              </div>
            ) : (
              <div className="flex flex-col pr-4">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} {...msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="bg-background flex w-full flex-col pt-2">
            <div className="mb-2 flex items-center justify-between px-1">
              {tps && messages.length > 0 && !isRunning ? (
                <div className="flex items-center gap-0.5">
                  <Muted className="text-xs">
                    {numTokens} tokens at {tps.toFixed(2)} tokens/sec.{" "}
                  </Muted>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      worker.current?.postMessage({ type: "reset" });
                      setMessages([]);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              ) : (
                <div />
              )}
              <Button
                variant={reasonEnabled ? "secondary" : "outline"}
                size="sm"
                onClick={() => setReasonEnabled(!reasonEnabled)}
              >
                <Lightbulb className={cn("h-4 w-4", reasonEnabled && "fill-primary")} />
                Reasoning
              </Button>
            </div>
            <ChatInput
              onSend={onSend}
              onInterrupt={onInterrupt}
              isRunning={isRunning}
              disabled={status !== "ready" && status !== "complete"}
            />
            <Muted className="mt-2 text-center text-xs">
              Disclaimer: Generated content may be inaccurate or false.
            </Muted>
          </div>
        </>
      )}
    </div>
  );
};

export default Qwen3Screen;
