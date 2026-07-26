import { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { GenerationProgress } from "@/apps/text-to-music/components/generation-progress";
import { encodeWav } from "@/apps/text-to-music/utils/wav-encoder";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/text-to-music/utils/worker-message-handler";
import MusicGenWorker from "@/apps/text-to-music/workers/musicgen.worker?worker";
import type { GenerationParams } from "../step-1";

type GenerationStepProps = {
  params: GenerationParams;
  onNext: (result: { audioBlob: Blob; samplingRate: number }) => void;
};

export const GenerationStep = ({ params, onNext }: GenerationStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("Initializing model...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (!workerRef.current) {
      const worker = new MusicGenWorker();

      const handler = createWorkerMessageHandler({
        setStatus,
        setProgressItems,
        setStatusText,
        setProgressPercent,
        onReady: () => {
          // Model ready
        },
        onComplete: (audioData, samplingRate) => {
          const wavBlob = encodeWav(audioData, samplingRate);
          onNextRef.current({ audioBlob: wavBlob, samplingRate });
        },
        setErrorMsg: setErrorMessage,
      });

      worker.addEventListener("message", handler);
      workerRef.current = worker;

      worker.postMessage({
        type: "generate",
        text: params.prompt,
        duration: params.duration,
        guidanceScale: params.guidanceScale,
        temperature: params.temperature,
      });
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [params.prompt, params.duration, params.guidanceScale, params.temperature]);

  const hasDownloadItems = Object.keys(progressItems).length > 0;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Download Progress Notification (Shown when downloading model chunks) */}
      {hasDownloadItems && <DownloadProgress progressItems={progressItems} />}

      {/* Generation Progress Indicator */}
      <GenerationProgress
        isGenerating={status !== "error" && status !== "complete"}
        statusText={statusText}
        progressPercent={progressPercent}
      />
    </div>
  );
};
