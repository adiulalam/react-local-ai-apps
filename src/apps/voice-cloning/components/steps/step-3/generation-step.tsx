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

let globalWorker: Worker | null = null;

type GenerationStepProps = {
  params: VoiceCloningParams;
  audioData?: Float32Array;
  onNext: (result: { audioBlob: Blob; samplingRate: number }) => void;
};

export const GenerationStep = ({ params, audioData, onNext }: GenerationStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("Downloading Chatterbox model...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (!globalWorker) {
      globalWorker = new VoiceCloningWorker();
    }
    const worker = globalWorker;

    const handler = createWorkerMessageHandler({
      setStatus,
      setProgressItems,
      setStatusText,
      setProgressPercent,
      onReady: () => {
        // Model loaded — encode the reference speaker voice
        worker.postMessage({
          type: "encode_speaker",
          data: { id: "user", audioData: audioData },
        });
      },
      onSpeakerEncoded: () => {
        // Speaker encoded — start generating speech
        worker.postMessage({
          type: "generate",
          data: {
            text: params.text,
            speakerId: "user",
            exaggeration: params.exaggeration,
          },
        });
      },
      onComplete: (generatedAudioData, samplingRate) => {
        const wavBlob = encodeWav(generatedAudioData, samplingRate);
        onNextRef.current({ audioBlob: wavBlob, samplingRate });
      },
      setErrorMsg: setErrorMessage,
    });

    worker.addEventListener("message", handler);

    // Phase 1: Load the model
    worker.postMessage({ type: "load", data: {} });

    return () => {
      worker.removeEventListener("message", handler);
    };
  }, [params.text, params.exaggeration, audioData]);

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
