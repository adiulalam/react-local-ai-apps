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
} from "@/apps/video-describer/utils/worker-message-handler";
import { audioPlayer } from "@/apps/video-describer/utils/audio-player";
import type { ProgressInfo } from "@/components/ui/download-progress";
import VideoDescriberWorker from "@/apps/video-describer/workers/video-describer.worker?worker";

export interface DescriptionItem {
  id: string;
  timestamp: string;
  text: string;
  timeInSeconds?: number;
}

export type VideoDescriberState = {
  videoUrl?: string;
  useWebcam?: boolean;
};

interface VideoDescriberContextType {
  formData: VideoDescriberState;
  setFormData: React.Dispatch<React.SetStateAction<VideoDescriberState>>;
  activeStep: number;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  errorMsg: string;
  isModelLoaded: boolean;
  loadModel: () => void;
  describeFrame: (imageData: string, timeInSeconds?: number) => void;
  currentDescription: string;
  history: DescriptionItem[];
  isAutoNarrate: boolean;
  setIsAutoNarrate: (val: boolean) => void;
  isTtsEnabled: boolean;
  setIsTtsEnabled: (val: boolean) => void;
  narrationInterval: number;
  setNarrationInterval: (val: number) => void;
  speakText: (text: string) => void;
  stopSpeech: () => void;
}

const VideoDescriberContext = createContext<VideoDescriberContextType | undefined>(undefined);

export const VideoDescriberProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<VideoDescriberState>({});
  const [activeStep, setActiveStep] = useState(1);

  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const [currentDescription, setCurrentDescription] = useState<string>("");
  const [history, setHistory] = useState<DescriptionItem[]>([]);
  const [isAutoNarrate, setIsAutoNarrate] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [narrationInterval, setNarrationInterval] = useState(5);

  const workerRef = useRef<Worker | null>(null);
  const isTtsEnabledRef = useRef(isTtsEnabled);

  useEffect(() => {
    isTtsEnabledRef.current = isTtsEnabled;
  }, [isTtsEnabled]);

  const pendingTimeRef = useRef<number | undefined>(undefined);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    if (formData.videoUrl) URL.revokeObjectURL(formData.videoUrl);
    setFormData({});
    setActiveStep(1);
    setCurrentDescription("");
    setHistory([]);
    setIsAutoNarrate(false);
    audioPlayer.stop();
  };

  const speakText = useCallback((text: string) => {
    audioPlayer.speak(text);
  }, []);

  const stopSpeech = useCallback(() => {
    audioPlayer.stop();
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new VideoDescriberWorker();

    const messageHandler = createWorkerMessageHandler<string>({
      setStatus,
      setProgressItems,
      onReady: () => {
        setStatus("idle");
        setIsModelLoaded(true);
      },
      onComplete: (caption) => {
        const trimmed = caption.trim();
        setCurrentDescription(trimmed);

        const now = new Date();
        const formattedTime = now.toLocaleTimeString();

        setHistory((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: formattedTime,
            text: trimmed,
            timeInSeconds: pendingTimeRef.current,
          },
          ...prev.slice(0, 19), // Keep last 20 descriptions
        ]);

        if (isTtsEnabledRef.current && trimmed) {
          audioPlayer.speak(trimmed);
        }
      },
      setErrorMsg,
    });

    workerRef.current.addEventListener("message", messageHandler);

    return () => {
      workerRef.current?.terminate();
      audioPlayer.stop();
    };
  }, []);

  const loadModel = useCallback(() => {
    if (workerRef.current && !isModelLoaded && status === "initializing") {
      workerRef.current.postMessage({ type: "load" });
    }
  }, [isModelLoaded, status]);

  const describeFrame = useCallback((imageData: string, timeInSeconds?: number) => {
    if (workerRef.current) {
      pendingTimeRef.current = timeInSeconds;
      workerRef.current.postMessage({ type: "process", image: imageData });
    }
  }, []);

  return (
    <VideoDescriberContext.Provider
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
        isModelLoaded,
        loadModel,
        describeFrame,
        currentDescription,
        history,
        isAutoNarrate,
        setIsAutoNarrate,
        isTtsEnabled,
        setIsTtsEnabled,
        narrationInterval,
        setNarrationInterval,
        speakText,
        stopSpeech,
      }}
    >
      {children}
    </VideoDescriberContext.Provider>
  );
};

export const useVideoDescriberContext = () => {
  const context = useContext(VideoDescriberContext);
  if (!context) {
    throw new Error("useVideoDescriberContext must be used within a VideoDescriberProvider");
  }
  return context;
};
