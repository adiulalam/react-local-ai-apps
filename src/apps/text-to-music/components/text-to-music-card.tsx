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
import { GenerationProgress, type GenerationProgressState } from "./generation-progress";
import { AudioPlayer } from "./audio-player";
import { encodeWav } from "../utils/wav-encoder";

export const TextToMusicCard = () => {
  const [prompt, setPrompt] = useState("");
  const [controls, setControls] = useState<MusicControlsState>({
    duration: 10,
    guidanceScale: 3.0,
    temperature: 1.0,
  });

  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});

  const [progress, setProgress] = useState<GenerationProgressState>({
    isGenerating: false,
    statusText: "",
  });

  const [audioResult, setAudioResult] = useState<{
    blob: Blob;
    audioData?: Float32Array;
    prompt: string;
    duration: number;
    samplingRate: number;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    const worker = new Worker(new URL("../workers/musicgen.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent) => {
      const { type, data, audio, audioData, samplingRate, error } = event.data || {};

      if (type === "progress") {
        if (data && typeof data === "object" && data.file) {
          const info = data as ProgressInfo;
          setProgressItems((prev) => ({ ...prev, [info.file]: info }));
          setProgress({
            isGenerating: true,
            statusText: `Downloading AI model (${info.file})...`,
          });
        }
      } else if (type === "ready") {
        setProgressItems({});
      } else if (type === "generating") {
        setProgressItems({});
        setProgress({
          isGenerating: true,
          statusText: "Generating (0%)...",
          progressPercent: 0,
        });
      } else if (type === "generating_progress") {
        const { statusText, progress: percent } = event.data || {};
        setProgress((prev) => ({
          ...prev,
          isGenerating: true,
          statusText: statusText || `Generating (${percent || 0}%)...`,
          progressPercent: typeof percent === "number" ? percent : prev.progressPercent,
        }));
      } else if (type === "complete") {
        setProgressItems({});
        const audioDataArray = audioData || (audio instanceof Float32Array ? audio : undefined);
        const wavBlob =
          event.data.audioBlob ||
          (audioDataArray ? encodeWav(audioDataArray, samplingRate || 32000) : null);

        if (wavBlob) {
          setAudioResult({
            blob: wavBlob,
            audioData: audioDataArray,
            prompt: prompt,
            duration: controls.duration,
            samplingRate: samplingRate || 32000,
          });
        }
        setProgress({
          isGenerating: false,
          statusText: "",
        });
      } else if (type === "error") {
        setProgressItems({});
        setErrorMessage(error || "An error occurred during music generation");
        setProgress({
          isGenerating: false,
          statusText: "",
        });
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [prompt, controls.duration]);

  const handleGenerate = () => {
    if (!prompt.trim() || progress.isGenerating) return;

    setErrorMessage(null);
    setAudioResult(null);
    setProgressItems({});
    setProgress({
      isGenerating: true,
      statusText: "Initializing model...",
    });

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
              disabled={progress.isGenerating}
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
          disabled={progress.isGenerating}
          rows={3}
          className="resize-none text-sm"
        />

        {/* Sample Presets */}
        <SamplePrompts
          onSelectPrompt={(selected) => setPrompt(selected)}
          disabled={progress.isGenerating}
        />
      </div>

      {/* Music Controls */}
      <MusicControls
        values={controls}
        onChange={(updates) => setControls((prev) => ({ ...prev, ...updates }))}
        disabled={progress.isGenerating}
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
      <GenerationProgress progress={progress} />

      {/* Action Button */}
      {!audioResult && (
        <div className="flex justify-end pt-2">
          <Button
            variant="default"
            size="lg"
            onClick={handleGenerate}
            disabled={!prompt.trim() || progress.isGenerating}
            className="gap-2 px-6 font-medium"
          >
            <Sparkles className="size-4" />
            {progress.isGenerating ? "Generating Music..." : "Generate Music"}
          </Button>
        </div>
      )}

      {/* Output Audio Player */}
      {audioResult && (
        <AudioPlayer
          audioBlob={audioResult.blob}
          audioData={audioResult.audioData}
          prompt={audioResult.prompt}
          duration={audioResult.duration}
          samplingRate={audioResult.samplingRate}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
