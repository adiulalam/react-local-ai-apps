import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import ImageCaptioningWorker from "@/apps/image-classifier/workers/image-captioning.worker?worker";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/image-classifier/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { useImageClassifierFormContext } from "./image-classifier-context";

type ImageCaptioningContextType = {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  error: string;
  generateCaption: (imageDataUrl: string) => void;
  resetWorker: () => void;
};

const ImageCaptioningContext = createContext<ImageCaptioningContextType | undefined>(undefined);

export const useImageCaptioningContext = () => {
  const context = useContext(ImageCaptioningContext);
  if (!context) {
    throw new Error("useImageCaptioningContext must be used within an ImageCaptioningProvider");
  }
  return context;
};

export const ImageCaptioningProvider = ({ children }: { children: ReactNode }) => {
  const { setCaption } = useImageClassifierFormContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [error, setError] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    workerRef.current = new ImageCaptioningWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setError("");
  };

  const generateCaption = (url: string) => {
    setStatus("initializing");
    setError("");
    setProgressItems({});
    setCaption(null);

    if (!workerRef.current) {
      workerRef.current = new ImageCaptioningWorker();
    }

    if (listenerRef.current) {
      workerRef.current.removeEventListener("message", listenerRef.current);
    }

    let processingStarted = false;

    listenerRef.current = createWorkerMessageHandler<string>({
      setStatus,
      setProgressItems,
      onReady: () => {
        if (!processingStarted) {
          processingStarted = true;
          workerRef.current?.postMessage({ type: "process", image: url });
        }
      },
      onComplete: (result) => {
        setCaption(result);
      },
      setErrorMsg: setError,
    });

    workerRef.current.addEventListener("message", listenerRef.current);
    workerRef.current.postMessage({ type: "load" });
  };

  return (
    <ImageCaptioningContext.Provider
      value={{
        status,
        progressItems,
        error,
        generateCaption,
        resetWorker,
      }}
    >
      {children}
    </ImageCaptioningContext.Provider>
  );
};
