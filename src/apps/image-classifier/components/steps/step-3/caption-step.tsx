import { useState, useEffect, useRef } from "react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { H3, Muted } from "@/components/ui/typography";
import { createWorkerMessageHandler, type WorkerStatus } from "../../../utils/worker-message-handler";
import ImageCaptioningWorker from "@/lib/workers/image-captioning.worker?worker";

interface CaptionStepProps {
  imageDataUrl: string;
}

export const CaptionStep = ({ imageDataUrl }: CaptionStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [caption, setCaption] = useState<string | null>(null);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    let processingStarted = false;

    if (!imageDataUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No image data provided. Please ensure previous steps completed successfully.");
      return;
    }

    if (!worker.current) {
      worker.current = new ImageCaptioningWorker();

      const messageHandler = createWorkerMessageHandler<string>({
        setStatus,
        setProgressItems,
        onReady: () => {
          if (!processingStarted) {
            processingStarted = true;
            worker.current?.postMessage({ type: "process", image: imageDataUrl });
          }
        },
        onComplete: (result) => {
          setCaption(result);
        },
        setErrorMsg,
      });

      worker.current.addEventListener("message", messageHandler);

      worker.current.postMessage({ type: "load" });
    }

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, [imageDataUrl]);

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && (
        <Muted>Checking cache and downloading required model chunks...</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Muted>Generating caption locally... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {status === "complete" && caption && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H3>Uploaded Image</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
              <img
                src={imageDataUrl}
                alt="Uploaded for captioning"
                className="max-h-64 rounded-md object-contain"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <H3>Caption Description</H3>
            <div className="bg-primary/5 rounded-lg border p-6 shadow-sm">
              <p data-testid="caption-text" className="text-lg font-medium italic text-foreground text-center">
                "{caption}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
