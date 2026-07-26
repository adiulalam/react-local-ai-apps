import { useState, useRef, useEffect } from "react";
import { Music, Sparkles, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { H1, Muted } from "@/components/ui/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { SamplePrompts } from "./sample-prompts";
import { MusicControls, type MusicControlsState } from "./music-controls";
import { GenerationProgress } from "./generation-progress";
import { AudioPlayer } from "./audio-player";
import { encodeWav } from "../utils/wav-encoder";
import { createWorkerMessageHandler, type WorkerStatus } from "../utils/worker-message-handler";

export const TextToMusicCard = () => {
  const [prompt, setPrompt] = useState("");
  const [controls, setControls] = useState<MusicControlsState>({
    duration: 10,
    guidanceScale: 3.0,
    temperature: 1.0,
  });

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const [audioResult, setAudioResult] = useState<{
    blob: Blob;
    prompt: string;
    duration: number;
    samplingRate: number;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentPromptRef = useRef(prompt);
  const currentDurationRef = useRef(controls.duration);

  useEffect(() => {
    currentPromptRef.current = prompt;
    currentDurationRef.current = controls.duration;
  }, [prompt, controls.duration]);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/musicgen.worker.ts", import.meta.url), {
      type: "module",
    });

    const handler = createWorkerMessageHandler({
      setStatus,
      setProgressItems,
      setStatusText,
      setProgressPercent,
      onReady: () => {
        setStatus("idle");
      },
      onComplete: (audioData, samplingRate) => {
        const wavBlob = encodeWav(audioData, samplingRate);
        setAudioResult({
          blob: wavBlob,
          prompt: currentPromptRef.current,
          duration: currentDurationRef.current,
          samplingRate: samplingRate,
        });
      },
      setErrorMsg: setErrorMessage,
    });

    worker.onmessage = handler;
    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const isGenerating = status === "loading" || status === "generating" || status === "initializing";

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    setErrorMessage(null);
    setAudioResult(null);
    setProgressItems({});
    setStatus("initializing");
    setStatusText("Initializing model...");
    setProgressPercent(0);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "generate",
        text: prompt.trim(),
        duration: controls.duration,
        guidanceScale: controls.guidanceScale,
        temperature: controls.temperature,
      });
    }
  };

  const handleReset = () => {
    setPrompt("");
    setAudioResult(null);
    setErrorMessage(null);
    setProgressItems({});
    setStatus("idle");
    setStatusText("");
    setProgressPercent(0);
    setControls({
      duration: 10,
      guidanceScale: 3.0,
      temperature: 1.0,
    });
  };

  return (
    <div className="bg-card mx-auto w-full max-w-4xl space-y-6 rounded-xl border p-6 shadow-sm">
      <div className="flex items-start justify-between border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Music className="text-primary size-6" />
            <H1 className="text-2xl font-bold tracking-tight">Text to Music</H1>
          </div>
          <Muted>
            Generate AI music tracks from text prompts locally in your browser using MusicGen.
          </Muted>
        </div>
      </div>

      {/* Download Progress Notification (Matching Local Scribe) */}
      <DownloadProgress progressItems={progressItems} />

      {/* Prompt Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Text Prompt</Label>
          {prompt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrompt("")}
              disabled={isGenerating}
              className="text-muted-foreground h-6 px-2 text-xs"
            >
              <X className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>

        <Textarea
          placeholder="Describe the music you want to generate (e.g. '80s synthwave pop track with energetic drums and retro synths')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          rows={3}
          className="resize-none text-sm"
        />

        {/* Sample Presets */}
        <SamplePrompts onSelectPrompt={(selected) => setPrompt(selected)} disabled={isGenerating} />
      </div>

      {/* Music Controls */}
      <MusicControls
        values={controls}
        onChange={(updates) => setControls((prev) => ({ ...prev, ...updates }))}
        disabled={isGenerating}
      />

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <GenerationProgress
        isGenerating={isGenerating}
        statusText={statusText}
        progressPercent={progressPercent}
      />

      {/* Action Button */}
      {!audioResult && (
        <div className="flex justify-end pt-2">
          <Button
            variant="default"
            size="lg"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="gap-2 px-6 font-medium"
          >
            <Sparkles className="size-4" />
            {isGenerating ? "Generating Music..." : "Generate Music"}
          </Button>
        </div>
      )}

      {/* Output Audio Player */}
      {audioResult && (
        <AudioPlayer
          audioBlob={audioResult.blob}
          prompt={audioResult.prompt}
          duration={audioResult.duration}
          samplingRate={audioResult.samplingRate}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
