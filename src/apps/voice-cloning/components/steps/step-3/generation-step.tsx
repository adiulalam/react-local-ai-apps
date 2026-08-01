import { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { GenerationProgress } from "@/apps/voice-cloning/components/generation-progress";
import { encodeWav } from "@/apps/voice-cloning/utils/wav-encoder";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/voice-cloning/utils/worker-message-handler";
import VoiceCloningWorker from "@/apps/voice-cloning/workers/voice-cloning.worker?worker";
import type { VoiceCloningParams } from "../step-2";

type GenerationStepProps = {
  params: VoiceCloningParams;
  audioData?: Float32Array;
  onNext: (result: { audioBlob: Blob; samplingRate: number }) => void;
};

export const GenerationStep = ({ params, audioData, onNext }: GenerationStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("Initializing Chatterbox model...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (!workerRef.current) {
      const worker = new VoiceCloningWorker();

      const handler = createWorkerMessageHandler({
        setStatus,
        setProgressItems,
        setStatusText,
        setProgressPercent,
        onReady: () => {
          // Model ready
        },
        onComplete: (generatedAudioData, samplingRate) => {
          const wavBlob = encodeWav(generatedAudioData, samplingRate);
          onNextRef.current({ audioBlob: wavBlob, samplingRate });
        },
        setErrorMsg: setErrorMessage,
      });

      worker.addEventListener("message", handler);
      workerRef.current = worker;

      worker.postMessage({
        type: "generate",
        text: params.text,
        audioData: audioData,
        exaggeration: params.exaggeration,
        temperature: params.temperature,
        repetitionPenalty: params.repetitionPenalty,
      });
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [params.text, params.exaggeration, params.temperature, params.repetitionPenalty, audioData]);

  const hasDownloadItems = Object.keys(progressItems).length > 0;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {hasDownloadItems && <DownloadProgress progressItems={progressItems} />}

      <GenerationProgress
        isGenerating={status !== "error" && status !== "complete"}
        statusText={statusText}
        progressPercent={progressPercent}
      />
    </div>
  );
};
