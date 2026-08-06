import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type DepthResult,
} from "@/apps/image-depth/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import ImageDepthWorker from "@/apps/image-depth/workers/image-depth.worker?worker";

export type ImageDepthState = {
  imageDataUrl?: string;
};

interface ImageDepthContextValue {
  formData: ImageDepthState;
  setFormData: React.Dispatch<React.SetStateAction<ImageDepthState>>;
  activeStep: number;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  status: WorkerStatus;
  errorMsg: string;
  progressItems: Record<string, ProgressInfo>;
  rawDepth: DepthResult | null;
  processImage: (imageDataUrl: string) => void;
}

const ImageDepthContext = createContext<ImageDepthContextValue | null>(null);

export const ImageDepthProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ImageDepthState>({});
  const [activeStep, setActiveStep] = useState(1);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [rawDepth, setRawDepth] = useState<DepthResult | null>(null);

  const worker = useRef<Worker | null>(null);
  const pendingImage = useRef<string | null>(null);
  const isLoaded = useRef(false);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setFormData({});
    setActiveStep(1);
    setStatus("idle");
    setRawDepth(null);
    setProgressItems({});
    setErrorMsg("");
  };

  useEffect(() => {
    worker.current = new ImageDepthWorker();

    const messageHandler = createWorkerMessageHandler<DepthResult>({
      setStatus,
      setProgressItems,
      onReady: () => {
        isLoaded.current = true;
        if (pendingImage.current) {
          worker.current?.postMessage({ type: "process", image: pendingImage.current });
          pendingImage.current = null;
        }
      },
      onComplete: (result) => {
        setRawDepth(result);
      },
      setErrorMsg,
    });

    worker.current.addEventListener("message", messageHandler);

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  const processImage = useCallback((imageDataUrl: string) => {
    if (!worker.current) return;

    setStatus("initializing");
    setRawDepth(null);
    setErrorMsg("");

    if (isLoaded.current) {
      worker.current.postMessage({ type: "process", image: imageDataUrl });
    } else {
      pendingImage.current = imageDataUrl;
      worker.current.postMessage({ type: "load" });
    }
  }, []);

  return (
    <ImageDepthContext.Provider
      value={{
        formData,
        setFormData,
        activeStep,
        nextStep,
        prevStep,
        reset,
        status,
        errorMsg,
        progressItems,
        rawDepth,
        processImage,
      }}
    >
      {children}
    </ImageDepthContext.Provider>
  );
};

export const useImageDepth = () => {
  const context = useContext(ImageDepthContext);
  if (!context) {
    throw new Error("useImageDepth must be used within an ImageDepthProvider");
  }
  return context;
};
