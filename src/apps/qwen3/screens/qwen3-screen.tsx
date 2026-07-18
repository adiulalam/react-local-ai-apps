import { useEffect, useState, useRef } from "react";
import { ChatMessage, ChatInput, ChatProgress, type ProgressItem } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Play, RefreshCw } from "lucide-react";
import { Qwen } from "@/components/icons/qwen";
import { H1, Muted, Large, Small } from "@/components/ui/typography";
import { createWorkerMessageHandler, type WorkerStatus } from "../utils/worker-message-handler";
import { cn } from "@/lib/utils";

const IS_WEBGPU_AVAILABLE = !!navigator.gpu;

interface Message {
  role: "user" | "assistant";
  content: string;
  answerIndex?: number;
}

const Qwen3Screen = () => {
  const worker = useRef<Worker | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      worker.current = new Worker(new URL("../../../lib/workers/qwen.worker.ts", import.meta.url), {
        type: "module",
      });
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
    if (scrollRef.current && isRunning) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
            className="mt-4"
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
          <div
            ref={scrollRef}
            className="scrollbar-thin w-full flex-1 overflow-y-auto scroll-smooth pb-4"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4">
                <Qwen className="text-muted-foreground h-16 w-16 opacity-20" />
                <Muted>Model loaded! Start chatting below.</Muted>
              </div>
            ) : (
              messages.map((msg, i) => <ChatMessage key={i} {...msg} />)
            )}
          </div>

          <div className="bg-background flex w-full flex-col pt-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="text-muted-foreground text-xs">
                {tps && messages.length > 0 && !isRunning && (
                  <span className="flex items-center space-x-2">
                    {numTokens} tokens at {tps.toFixed(2)} tokens/sec.{" "}
                    <Button
                      variant="link"
                      size="xs"
                      onClick={() => {
                        worker.current?.postMessage({ type: "reset" });
                        setMessages([]);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReasonEnabled(!reasonEnabled)}
                className={cn(
                  "h-8 gap-2 rounded-full transition-colors",
                  reasonEnabled &&
                    "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                )}
              >
                <Lightbulb className={cn("h-4 w-4", reasonEnabled ? "fill-primary" : "")} />
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
