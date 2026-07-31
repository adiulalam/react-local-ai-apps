import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Languages,
  Play,
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Clipboard,
  Square,
  Globe,
  Zap,
} from "lucide-react";
import { H1, Muted, Large, Small } from "@/components/ui/typography";
import { ChatProgress, type ProgressItem } from "@/components/chat";
import { createWorkerMessageHandler, type WorkerStatus } from "../utils/worker-message-handler";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES, getLanguageName } from "../utils/languages";
import TranslateWorker from "@/apps/translate-gemma/workers/translate-gemma.worker?worker";

const IS_WEBGPU_AVAILABLE = !!navigator.gpu;

const SAMPLE_PRESETS = [
  {
    text: "Hello! Welcome to TranslateGemma, a private browser-based AI translator.",
    label: "Welcome",
  },
  { text: "Everything runs locally on your device with WebGPU acceleration.", label: "Local AI" },
  { text: "The quick brown fox jumps over the lazy dog.", label: "Pangram" },
];

const TranslateGemmaScreen = () => {
  const worker = useRef<Worker | null>(null);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [sourceText, setSourceText] = useState(
    "Hello! Welcome to TranslateGemma, a private browser-based AI translator."
  );
  const [translatedText, setTranslatedText] = useState("");

  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSourceChange = (val: string | null) => {
    if (val) setSourceLang(val);
  };

  const handleTargetChange = (val: string | null) => {
    if (val) setTargetLang(val);
  };

  const triggerTranslation = useCallback(
    (textToTranslate: string, src: string, tgt: string) => {
      if (!textToTranslate.trim() || (status !== "ready" && status !== "complete")) return;
      setIsRunning(true);
      setTps(null);
      setTranslatedText("");
      worker.current?.postMessage({
        type: "translate",
        data: {
          text: textToTranslate,
          sourceLang: src,
          targetLang: tgt,
        },
      });
    },
    [status]
  );

  const handleInterrupt = () => {
    worker.current?.postMessage({ type: "interrupt" });
    setIsRunning(false);
  };

  useEffect(() => {
    if (!worker.current) {
      worker.current = new TranslateWorker();
      worker.current.postMessage({ type: "check" });
    }

    const onMessageReceived = createWorkerMessageHandler({
      setStatus,
      setLoadingMessage,
      setProgressItems,
      setErrorMsg: setError,
      onReady: () => {},
      onStart: () => {
        setTranslatedText("");
      },
      onUpdate: (chunk, newTps, newNumTokens) => {
        setTranslatedText((prev) => prev + chunk);
        setTps(newTps ?? null);
        setNumTokens(newNumTokens);
      },
      onComplete: (result) => {
        setIsRunning(false);
        if (result && result[0]) {
          setTranslatedText(result[0]);
        }
      },
    });

    worker.current.addEventListener("message", onMessageReceived);
    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, []);

  const handleStart = () => {
    setStatus("loading");
    setError(null);
    setProgressItems([]);
    worker.current?.postMessage({ type: "load" });
  };

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") return;
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    setSourceLang(oldTarget);
    setTargetLang(oldSource);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    if (status === "ready" || status === "complete") {
      triggerTranslation(translatedText, oldTarget, oldSource);
    }
  };

  const handleCopyTarget = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePasteSource = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSourceText(text);
    } catch {
      // Permission denied or unavailable
    }
  };

  if (!IS_WEBGPU_AVAILABLE) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <Card className="bg-destructive/10 border-destructive w-full max-w-md">
          <CardContent className="text-destructive pt-6 text-center">
            <Large>WebGPU is not supported</Large>
            <Muted className="text-destructive/80 mt-2">
              Please use a browser that supports WebGPU to run TranslateGemma locally.
            </Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-80px)] w-full max-w-5xl flex-col px-4 py-6">
      {status === "idle" || status === "error" ? (
        <div className="flex h-full flex-col items-center justify-center space-y-6">
          <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <Languages className="text-primary h-10 w-10" />
          </div>
          <H1 className="text-center text-3xl">TranslateGemma</H1>
          <Muted className="max-w-lg text-center text-base">
            High-quality local translation powered by Google&apos;s TranslateGemma model. Translates
            between 56 languages entirely on your device using WebGPU with 100% privacy.
          </Muted>

          {error && (
            <Small className="text-destructive bg-destructive/10 block w-full max-w-md rounded-lg p-3 text-center">
              {error}
            </Small>
          )}

          <Button size="lg" onClick={handleStart}>
            <Play className="mr-2 h-4 w-4" />
            Start Model
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="flex h-full flex-col items-center justify-center">
          <ChatProgress message={loadingMessage} items={progressItems} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <H1 className="text-xl">TranslateGemma</H1>
              <Muted className="text-xs">translategemma-text-4b</Muted>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Source Text Pane */}
            <Card className="flex flex-col border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-2">
                  <Globe className="text-muted-foreground h-4 w-4" />
                  <Label className="text-xs font-semibold tracking-wider uppercase">From</Label>
                </div>
                <Select value={sourceLang} onValueChange={handleSourceChange}>
                  <SelectTrigger className="h-8 w-45 text-xs" aria-label="Source Language">
                    <SelectValue>{getLanguageName(sourceLang)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative p-3">
                <Textarea
                  className="min-h-36 w-full resize-none border-none font-sans text-base leading-relaxed focus-visible:ring-0"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Type or paste text to translate..."
                  aria-label="Source Text"
                />
              </div>

              <div className="border-t p-2">
                <div className="mb-2 flex flex-wrap gap-1">
                  <Muted className="mr-1 self-center text-[11px]">Presets:</Muted>
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="xs"
                      className="text-xs"
                      onClick={() => setSourceText(preset.text)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handlePasteSource}
                      title="Paste from clipboard"
                    >
                      <Clipboard className="mr-1 h-3.5 w-3.5" />
                      Paste
                    </Button>
                    {sourceText && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSourceText("")}
                        title="Clear source text"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <Muted className="font-mono text-xs">
                    {sourceText.length} chars &bull;{" "}
                    {sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0} words
                  </Muted>
                </div>
              </div>
            </Card>

            {/* Target Text Pane */}
            <Card className="flex flex-col border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSwapLanguages}
                    disabled={sourceLang === "auto"}
                    title="Swap languages"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                  <Label className="text-xs font-semibold tracking-wider uppercase">To</Label>
                </div>

                <Select value={targetLang} onValueChange={handleTargetChange}>
                  <SelectTrigger className="h-8 w-45 text-xs" aria-label="Target Language">
                    <SelectValue>{getLanguageName(targetLang)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative p-3">
                {translatedText ? (
                  <div
                    data-testid="target-translation-output"
                    className="min-h-36 w-full font-sans text-base leading-relaxed whitespace-pre-wrap"
                  >
                    {translatedText}
                  </div>
                ) : (
                  <div className="flex min-h-36 items-center justify-center">
                    <Muted className="text-sm">
                      {isRunning ? "Translating..." : "Translation will appear here..."}
                    </Muted>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t p-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopyTarget}
                    disabled={!translatedText}
                  >
                    {isCopied ? (
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="mr-1 h-3.5 w-3.5" />
                    )}
                    {isCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                {tps !== null && numTokens !== null && (
                  <Muted className="font-mono text-xs">
                    {numTokens} tokens @ {tps.toFixed(1)} t/s
                  </Muted>
                )}
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-end pt-2">
            {isRunning ? (
              <Button variant="destructive" onClick={handleInterrupt}>
                <Square className="mr-2 h-4 w-4 fill-current" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={() => triggerTranslation(sourceText, sourceLang, targetLang)}
                disabled={!sourceText.trim()}
              >
                <Zap className="mr-2 h-4 w-4 fill-current" />
                Translate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslateGemmaScreen;
