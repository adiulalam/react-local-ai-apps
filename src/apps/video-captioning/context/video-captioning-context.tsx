import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type ProgressInfo } from "@/components/ui/download-progress";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type CaptionChunk,
} from "@/apps/video-captioning/utils/worker-message-handler";
import VideoCaptioningWorker from "@/apps/video-captioning/workers/video-captioning.worker?worker";

export type VideoCaptioningState = {
  videoUrl?: string;
  videoBlob?: Blob;
  chunks?: CaptionChunk[];
};

interface VideoCaptioningContextType {
  formData: VideoCaptioningState;
  activeStep: number;
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  captionProgress: { statusText: string; progress: number } | null;
  errorMsg: string;

  setFormData: (data: Partial<VideoCaptioningState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  processAudio: () => Promise<void>;
  setActiveStep: (step: number) => void;
}

const VideoCaptioningContext = createContext<VideoCaptioningContextType | undefined>(undefined);

export const VideoCaptioningProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<VideoCaptioningState>({});
  const [activeStep, setActiveStep] = useState(1);
  const workerRef = useRef<Worker | null>(null);

  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [captionProgress, setCaptionProgress] = useState<{
    statusText: string;
    progress: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const videoBlobRef = useRef<Blob | undefined>(undefined);

  useEffect(() => {
    videoBlobRef.current = formData.videoBlob;
  }, [formData.videoBlob]);

  useEffect(() => {
    workerRef.current = new VideoCaptioningWorker();

    const messageHandler = createWorkerMessageHandler({
      setStatus,
      setProgressItems: (updater) => setProgressItems(updater),
      onReady: () => {
        setStatus("processing");
        setCaptionProgress({ statusText: "Captioning...", progress: 0 });
        startProcessingAudio();
      },
      onProgress: (data) => {
        setCaptionProgress(data);
      },
      onComplete: (result) => {
        setStatus("complete");
        setFormData((prev) => ({ ...prev, chunks: result }));
        setActiveStep((prev) => Math.min(prev + 1, 3));
      },
      setErrorMsg,
    });

    workerRef.current.addEventListener("message", messageHandler);

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const startProcessingAudio = async () => {
    const blob = videoBlobRef.current;
    if (!blob) return;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Array = audioBuffer.getChannelData(0);

      if (workerRef.current) {
        workerRef.current.postMessage({ type: "process", audio: float32Array });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to process audio from video");
    }
  };

  const processAudio = async () => {
    if (!workerRef.current || status === "initializing" || status === "processing" || status === "loading") return;
    setStatus("initializing");
    setErrorMsg("");
    setCaptionProgress(null);
    setProgressItems({});
    workerRef.current.postMessage({ type: "load" });
  };

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    if (formData.videoUrl) URL.revokeObjectURL(formData.videoUrl);
    setFormData({});
    setActiveStep(1);
    setStatus("idle");
    setCaptionProgress(null);
    setProgressItems({});
    setErrorMsg("");
  };

  const handleSetFormData = (data: Partial<VideoCaptioningState>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <VideoCaptioningContext.Provider
      value={{
        formData,
        activeStep,
        status,
        progressItems,
        captionProgress,
        errorMsg,
        setFormData: handleSetFormData,
        nextStep,
        prevStep,
        reset,
        processAudio,
        setActiveStep,
      }}
    >
      {children}
    </VideoCaptioningContext.Provider>
  );
};

export const useVideoCaptioningContext = () => {
  const context = useContext(VideoCaptioningContext);
  if (!context) {
    throw new Error("useVideoCaptioningContext must be used within a VideoCaptioningProvider");
  }
  return context;
};
