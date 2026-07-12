import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { Progress } from "@/components/ui/progress";
import { H3, Muted } from "@/components/ui/typography";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type ClassificationResult,
} from "../../../utils/worker-message-handler";

import { Button } from "@/components/ui/button";
import ImageClassificationWorker from "@/lib/workers/image-classification.worker?worker";

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

  useEffect(() => {
    let processingStarted = false;

    if (!imageDataUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No image data provided. Please ensure Step 1 completed successfully.");
      return;
    }

    if (!worker.current) {
      worker.current = new ImageClassificationWorker();

      const messageHandler = createWorkerMessageHandler({
        setStatus,
        setProgressItems,
        onReady: () => {
          if (!processingStarted) {
            processingStarted = true;
            worker.current?.postMessage({ type: "process", image: imageDataUrl });
          }
        },
        onComplete: (classificationResults) => {
          setResults(classificationResults);
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
          <Muted>Classifying image locally... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {status === "complete" && results && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H3>Uploaded Image</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
              <img
                src={imageDataUrl}
                alt="Uploaded for classification"
                className="max-h-64 rounded-md object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <H3>Classification Results</H3>
            <ul className="space-y-3">
              {results.map((result, index) => (
                <li key={index} className="bg-background space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{result.label}</span>
                    <Muted>{(result.score * 100).toFixed(2)}%</Muted>
                  </div>
                  <Progress value={result.score * 100} />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => onNext(results)}>
                Next: Generate Caption
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
