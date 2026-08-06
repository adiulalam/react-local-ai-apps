import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { type ProgressInfo } from "@/components/ui/download-progress";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/image-classifier/utils/worker-message-handler";
import BackgroundRemoverWorker from "@/apps/background-remover/workers/background-remover.worker?worker";

export type BackgroundRemoverState = {
  imageDataUrl?: string;
};

interface RemovalResult {
  maskData: Uint8Array;
  width: number;
  height: number;
}

interface BackgroundRemoverContextType {
  formData: BackgroundRemoverState;
  setFormData: React.Dispatch<React.SetStateAction<BackgroundRemoverState>>;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  status: WorkerStatus;
  errorMsg: string;
  progressItems: Record<string, ProgressInfo>;
  resultImage: string | null;
  processImage: (imageDataUrl: string) => void;
}

const BackgroundRemoverContext = createContext<BackgroundRemoverContextType | undefined>(undefined);

export const BackgroundRemoverProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<BackgroundRemoverState>({});
  const [activeStep, setActiveStep] = useState(1);
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [resultImage, setResultImage] = useState<string | null>(null);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    worker.current = new BackgroundRemoverWorker();

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  const nextStep = useCallback(() => setActiveStep((prev) => Math.min(prev + 1, 2)), []);
  const prevStep = useCallback(() => setActiveStep((prev) => Math.max(prev - 1, 1)), []);
  const reset = useCallback(() => {
    setFormData({});
    setActiveStep(1);
    setStatus("idle");
    setErrorMsg("");
    setProgressItems({});
    setResultImage(null);
  }, []);

  const processImage = useCallback((imageDataUrl: string) => {
    if (!worker.current) return;
    setStatus("initializing");
    setErrorMsg("");
    setResultImage(null);
    setProgressItems({});

    let processingStarted = false;

    const messageHandler = createWorkerMessageHandler<RemovalResult>({
      setStatus,
      setProgressItems,
      onReady: () => {
        if (!processingStarted) {
          processingStarted = true;
          worker.current?.postMessage({ type: "process", image: imageDataUrl });
        }
      },
      onComplete: async (result) => {
        const { maskData, width, height } = result;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageDataUrl;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);

          const pixelData = ctx.getImageData(0, 0, width, height);
          for (let i = 0; i < maskData.length; ++i) {
            pixelData.data[4 * i + 3] = maskData[i];
          }
          ctx.putImageData(pixelData, 0, 0);

          setResultImage(canvas.toDataURL("image/png"));
        };
      },
      setErrorMsg,
    });

    worker.current.onmessage = (e) => messageHandler(e);
    worker.current.postMessage({ type: "load" });
  }, []);

  return (
    <BackgroundRemoverContext.Provider
      value={{
        formData,
        setFormData,
        activeStep,
        setActiveStep,
        nextStep,
        prevStep,
        reset,
        status,
        errorMsg,
        progressItems,
        resultImage,
        processImage,
      }}
    >
      {children}
    </BackgroundRemoverContext.Provider>
  );
};

export const useBackgroundRemover = () => {
  const context = useContext(BackgroundRemoverContext);
  if (context === undefined) {
    throw new Error("useBackgroundRemover must be used within a BackgroundRemoverProvider");
  }
  return context;
};
