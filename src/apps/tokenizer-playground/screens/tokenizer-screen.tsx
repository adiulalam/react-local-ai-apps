import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Play, PiggyBank, RefreshCw } from "lucide-react";
import { H1, Muted, Large, Small } from "@/components/ui/typography";
import { ChatProgress, type ProgressItem } from "@/components/chat";
import TokenizerWorker from "@/apps/tokenizer-playground/workers/tokenizer.worker?worker";
import { Token } from "@/apps/tokenizer-playground/components/token";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/tokenizer-playground/utils/worker-message-handler";

const TOKENIZER_OPTIONS = {
  "Xenova/gpt-4": "gpt-4 / gpt-3.5-turbo",
  "Xenova/grok-1-tokenizer": "Grok-1",
  "Xenova/claude-tokenizer": "Claude",
  "Xenova/mistral-tokenizer-v3": "Mistral v3",
  "Xenova/gemma-tokenizer": "Gemma",
  "Xenova/llama-3-tokenizer": "Llama 3",
  "Xenova/t5-small": "T5",
  "Xenova/bert-base-cased": "bert-base-cased",
  custom: "Custom",
} as const;

const TokenizerScreen = () => {
  const worker = useRef<Worker | null>(null);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

  const [tokenizer, setTokenizer] = useState<string>("Xenova/gpt-4");
  const [customTokenizer, setCustomTokenizer] = useState("");
  const [textInput, setTextInput] = useState(
    "Tokenizer Playground running locally in your browser."
  );
  const [outputOption, setOutputOption] = useState<"text" | "token_ids" | "hide">("text");

  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [decodedTokens, setDecodedTokens] = useState<string[]>([]);
  const [margins, setMargins] = useState<number[]>([]);

  const activeModelId = tokenizer === "custom" ? customTokenizer : tokenizer;

  useEffect(() => {
    if (!worker.current) {
      worker.current = new TokenizerWorker();
    }

    const onMessageReceived = createWorkerMessageHandler({
      setStatus,
      setLoadingMessage,
      setProgressItems,
      onReady: () => {
        // Trigger first tokenization
        worker.current?.postMessage({
          type: "tokenize",
          model_id: activeModelId,
          text: textInput,
        });
      },
      onTokenized: (data) => {
        setTokenIds(data.token_ids);
        setDecodedTokens(data.decoded);
        setMargins(data.margins);
      },
      setErrorMsg: setError,
    });

    worker.current.addEventListener("message", onMessageReceived);
    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, [activeModelId, textInput]);

  const handleStart = () => {
    if (!activeModelId) return;
    setStatus("loading");
    setError(null);
    setProgressItems([]);
    worker.current?.postMessage({
      type: "load",
      model_id: activeModelId,
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextInput(val);
    if (status === "ready" && activeModelId) {
      worker.current?.postMessage({
        type: "tokenize",
        model_id: activeModelId,
        text: val,
      });
    }
  };

  const handleTokenizerChange = (val: string | null) => {
    if (!val) return;
    setTokenizer(val);
    if (status === "ready") {
      setStatus("idle"); // reset to idle to require clicking Start again
      setTokenIds([]);
      setDecodedTokens([]);
      setMargins([]);
    }
  };

  return (
    <div className="relative mx-auto flex h-[calc(100vh-80px)] w-full max-w-4xl flex-col px-4 py-6">
      {status === "idle" || status === "error" ? (
        <div className="flex h-full flex-col items-center justify-center space-y-6">
          <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <PiggyBank className="text-primary h-10 w-10" />
          </div>
          <H1 className="text-center text-3xl">Tokenizer Playground</H1>
          <Muted className="max-w-lg text-center text-base">
            Experiment with different tokenizers running locally in your browser. All tokenization
            happens completely offline.
          </Muted>

          <div className="flex w-full max-w-sm flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Select Tokenizer</Label>
              <Select value={tokenizer} onValueChange={handleTokenizerChange}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Select Tokenizer" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOKENIZER_OPTIONS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tokenizer === "custom" && (
              <div className="flex flex-col gap-2">
                <Label>Custom Tokenizer (Hugging Face Model ID)</Label>
                <Input
                  placeholder="e.g. Xenova/t5-small"
                  value={customTokenizer}
                  onChange={(e) => setCustomTokenizer(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <Small className="text-destructive bg-destructive/10 block w-full max-w-md rounded-lg p-3 text-center">
              {error}
            </Small>
          )}
          <Button size="lg" onClick={handleStart} disabled={!activeModelId}>
            <Play className="mr-2 h-4 w-4" />
            Start Model
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="flex h-full flex-col items-center justify-center">
          <ChatProgress message={loadingMessage} items={progressItems} />
        </div>
      ) : (
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <H1 className="text-2xl">Tokenizer Playground</H1>
              <Muted>Model: {activeModelId}</Muted>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Change Model
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Label>Input Text</Label>
            <Textarea
              className="resize-none font-mono text-base"
              rows={5}
              value={textInput}
              onChange={handleTextChange}
              placeholder="Enter some text..."
            />

            <div className="my-4 flex items-center justify-center gap-12">
              <div className="flex flex-col items-center">
                <Muted className="text-xs tracking-wider uppercase">Tokens</Muted>
                <Large className="text-3xl">{tokenIds.length.toLocaleString()}</Large>
              </div>
              <div className="flex flex-col items-center">
                <Muted className="text-xs tracking-wider uppercase">Characters</Muted>
                <Large className="text-3xl">{textInput.length.toLocaleString()}</Large>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label>Output:</Label>
              <RadioGroup
                className="flex items-center space-x-2"
                value={outputOption}
                onValueChange={(v) => setOutputOption(v as "text" | "token_ids" | "hide")}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="text" id="r-text" />
                  <Label htmlFor="r-text">Text</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="token_ids" id="r-tokens" />
                  <Label htmlFor="r-tokens">Token IDs</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="hide" id="r-hide" />
                  <Label htmlFor="r-hide">Hide</Label>
                </div>
              </RadioGroup>
            </div>

            <Card className="bg-muted/50 border-muted flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <CardContent data-testid="token-output" className="p-4 font-mono text-base">
                  {outputOption === "text" ? (
                    decodedTokens.map((token, index) => (
                      <Token
                        key={index}
                        text={token}
                        position={index}
                        margin={margins[index] || 0}
                      />
                    ))
                  ) : outputOption === "token_ids" ? (
                    <Muted className="text-base wrap-break-word whitespace-pre-wrap">
                      [{tokenIds.join(", ")}]
                    </Muted>
                  ) : null}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenizerScreen;
