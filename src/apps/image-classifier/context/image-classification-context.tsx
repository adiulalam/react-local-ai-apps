import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import ImageClassificationWorker from "@/apps/image-classifier/workers/image-classification.worker?worker";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/image-classifier/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { useImageClassifierFormContext } from "./image-classifier-context";

type ImageClassificationContextType = {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  error: string;
  classifyImage: (imageDataUrl: string) => void;
  resetWorker: () => void;
};

const ImageClassificationContext = createContext<ImageClassificationContextType | undefined>(
  undefined
);

export const useImageClassificationContext = () => {
  const context = useContext(ImageClassificationContext);
  if (!context) {
    throw new Error(
      "useImageClassificationContext must be used within an ImageClassificationProvider"
    );
  }
  return context;
};

export const ImageClassificationProvider = ({ children }: { children: ReactNode }) => {
  const { setResults, setImageDataUrl } = useImageClassifierFormContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [error, setError] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    workerRef.current = new ImageClassificationWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setError("");
  };

  const classifyImage = (url: string) => {
    setImageDataUrl(url);
    setStatus("initializing");
    setError("");
    setProgressItems({});
    setResults(null);

    if (!workerRef.current) {
      workerRef.current = new ImageClassificationWorker();
    }

    if (listenerRef.current) {
      workerRef.current.removeEventListener("message", listenerRef.current);
    }

    let processingStarted = false;

    listenerRef.current = createWorkerMessageHandler({
      setStatus,
      setProgressItems,
      onReady: () => {
        if (!processingStarted) {
          processingStarted = true;
          workerRef.current?.postMessage({ type: "process", image: url });
        }
      },
      onComplete: (result) => {
        setResults(result);
      },
      setErrorMsg: setError,
    });

    workerRef.current.addEventListener("message", listenerRef.current);
    workerRef.current.postMessage({ type: "load" });
  };

  return (
    <ImageClassificationContext.Provider
      value={{
        status,
        progressItems,
        error,
        classifyImage,
        resetWorker,
      }}
    >
      {children}
    </ImageClassificationContext.Provider>
  );
};
