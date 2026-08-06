import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type DetectionResult,
} from "@/apps/object-detection/utils/worker-message-handler";
import type { ProgressInfo } from "@/components/ui/download-progress";
import ObjectDetectionWorker from "@/apps/object-detection/workers/object-detection.worker?worker";

export type ObjectDetectionState = {
  videoUrl?: string;
  useWebcam?: boolean;
};

interface ObjectDetectionContextType {
  formData: ObjectDetectionState;
  setFormData: React.Dispatch<React.SetStateAction<ObjectDetectionState>>;
  activeStep: number;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  errorMsg: string;
  loadModel: () => void;
  processImage: (imageData: string, threshold?: number) => void;
  setDetectionCallback: (cb: (result: DetectionResult[]) => void) => void;
  isModelLoaded: boolean;
}

const ObjectDetectionContext = createContext<ObjectDetectionContextType | undefined>(undefined);

export const ObjectDetectionProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ObjectDetectionState>({});
  const [activeStep, setActiveStep] = useState(1);

  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const detectionCallbackRef = useRef<((result: DetectionResult[]) => void) | undefined>(undefined);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    if (formData.videoUrl) URL.revokeObjectURL(formData.videoUrl);
    setFormData({});
    setActiveStep(1);
  };

  const setDetectionCallback = useCallback((cb: (result: DetectionResult[]) => void) => {
    detectionCallbackRef.current = cb;
  }, []);

  // Initialize Worker on mount, terminate on unmount
  useEffect(() => {
    workerRef.current = new ObjectDetectionWorker();

    const messageHandler = createWorkerMessageHandler<DetectionResult[]>({
      setStatus,
      setProgressItems,
      onReady: () => {
        setStatus("idle");
        setIsModelLoaded(true);
      },
      onComplete: (result) => {
        if (detectionCallbackRef.current) {
          detectionCallbackRef.current(result);
        }
      },
      setErrorMsg,
    });

    workerRef.current.addEventListener("message", messageHandler);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadModel = useCallback(() => {
    if (workerRef.current && !isModelLoaded && status === "initializing") {
      workerRef.current.postMessage({ type: "load" });
    }
  }, [isModelLoaded, status]);

  const processImage = useCallback((imageData: string, threshold: number = 0.5) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "process", image: imageData, threshold });
    }
  }, []);

  return (
    <ObjectDetectionContext.Provider
      value={{
        formData,
        setFormData,
        activeStep,
        nextStep,
        prevStep,
        reset,
        status,
        progressItems,
        errorMsg,
        loadModel,
        processImage,
        setDetectionCallback,
        isModelLoaded,
      }}
    >
      {children}
    </ObjectDetectionContext.Provider>
  );
};

export const useObjectDetectionContext = () => {
  const context = useContext(ObjectDetectionContext);
  if (!context) {
    throw new Error("useObjectDetectionContext must be used within an ObjectDetectionProvider");
  }
  return context;
};
