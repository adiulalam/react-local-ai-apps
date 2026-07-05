import { useState, useEffect, useRef } from "react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { H3, Muted } from "@/components/ui/typography";
import { createWorkerMessageHandler, type WorkerStatus, type ClassificationResult } from "../../../utils/worker-message-handler";

interface ClassificationStepProps {
  imageDataUrl: string;
  onNext: (results: ClassificationResult[]) => void;
}

export const ClassificationStep = ({ imageDataUrl, onNext }: ClassificationStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [results, setResults] = useState<ClassificationResult[] | null>(null);

  const worker = useRef<Worker | null>(null);
  const processingStarted = useRef(false);

  useEffect(() => {
    if (!imageDataUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No image data provided. Please ensure Step 1 completed successfully.");
      return;
    }

    if (!worker.current) {
      worker.current = new Worker(
        new URL("../../../../../lib/workers/image-classification.worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      const messageHandler = createWorkerMessageHandler({
        setStatus,
        setProgressItems,
        onReady: () => {
          if (!processingStarted.current) {
            processingStarted.current = true;
            worker.current?.postMessage({ type: "process", image: imageDataUrl });
          }
        },
        onComplete: (classificationResults) => {
          setResults(classificationResults);
          onNext(classificationResults);
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
  }, [imageDataUrl, onNext]);

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && (
        <Muted>Checking cache and downloading required model chunks...</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Muted>Classifying image locally... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {status === "complete" && results && (
        <div className="space-y-4">
          <H3>Classification Results</H3>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index} className="flex justify-between items-center bg-background rounded-lg p-3 border">
                <span className="font-medium capitalize">{result.label}</span>
                <Muted>{(result.score * 100).toFixed(2)}%</Muted>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
