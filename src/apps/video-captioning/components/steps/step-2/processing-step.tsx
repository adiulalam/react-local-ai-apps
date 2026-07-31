import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Muted, Small } from "@/components/ui/typography";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type CaptionChunk,
} from "@/apps/video-captioning/utils/worker-message-handler";
import VideoCaptioningWorker from "@/apps/video-captioning/workers/video-captioning.worker?worker";

interface ProcessingStepProps {
  videoBlob?: Blob;
  onNext: (data: { chunks: CaptionChunk[] }) => void;
}

export const ProcessingStep = ({ videoBlob, onNext }: ProcessingStepProps) => {
  const workerRef = useRef<Worker | null>(null);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [captionProgress, setCaptionProgress] = useState<{
    statusText: string;
    progress: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!videoBlob) return;

    let isSubscribed = true;

    const initWorker = async () => {
      setStatus("initializing");
      try {
        if (!workerRef.current) {
          workerRef.current = new VideoCaptioningWorker();

          const messageHandler = createWorkerMessageHandler({
            setStatus: (s) => isSubscribed && setStatus(s),
            setProgressItems: (updater) => isSubscribed && setProgressItems(updater),
            onReady: () => {
              if (isSubscribed) {
                setStatus("processing");
                setCaptionProgress({ statusText: "Captioning...", progress: 0 });
                processAudio();
              }
            },
            onProgress: (data) => {
              if (isSubscribed) {
                setCaptionProgress(data);
              }
            },
            onComplete: (result) => {
              if (isSubscribed) {
                setStatus("complete");
                onNext({ chunks: result });
              }
            },
            setErrorMsg: (msg) => isSubscribed && setErrorMsg(msg),
          });

          workerRef.current.addEventListener("message", messageHandler);
        }

        // Initialize model
        workerRef.current.postMessage({ type: "load" });
      } catch (err) {
        if (isSubscribed) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Failed to initialize worker");
        }
      }
    };

    const processAudio = async () => {
      try {
        const arrayBuffer = await videoBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000,
        });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const float32Array = audioBuffer.getChannelData(0);

        if (isSubscribed && workerRef.current) {
          workerRef.current.postMessage({ type: "process", audio: float32Array });
        }
      } catch (err) {
        if (isSubscribed) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Failed to process audio from video");
        }
      }
    };

    initWorker();

    return () => {
      isSubscribed = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [videoBlob, onNext]);

  return (
    <div className="space-y-6">
      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {status === "loading" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Small>Downloading model files...</Small>
          </div>
          <DownloadProgress progressItems={progressItems} />
        </div>
      )}

      {(status === "initializing" || status === "processing" || status === "complete") && (
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <Muted>
            {status === "initializing"
              ? "Initializing..."
              : captionProgress?.statusText || "Transcribing audio..."}
          </Muted>
          {status === "processing" && captionProgress && (
            <Progress value={captionProgress.progress} className="mt-4 h-2 w-full" />
          )}
        </div>
      )}
    </div>
  );
};
