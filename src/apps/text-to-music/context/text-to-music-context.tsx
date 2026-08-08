import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { encodeWav } from "@/apps/text-to-music/utils/wav-encoder";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/text-to-music/utils/worker-message-handler";
import MusicGenWorker from "@/apps/text-to-music/workers/musicgen.worker?worker";
import type { ProgressInfo } from "@/components/ui/download-progress";
import type { GenerationParams } from "@/apps/text-to-music/components/steps/step-1";

export type TextToMusicState = {
  params?: GenerationParams;
  audioBlob?: Blob;
  samplingRate?: number;
};

type TextToMusicContextType = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  formData: TextToMusicState;
  setFormData: React.Dispatch<React.SetStateAction<TextToMusicState>>;

  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  statusText: string;
  progressPercent: number;
  errorMessage: string | null;

  process: (params: GenerationParams) => void;
};

const TextToMusicContext = createContext<TextToMusicContextType | null>(null);

export const TextToMusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<TextToMusicState>({});

  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("Initializing model...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new MusicGenWorker();

    const handler = createWorkerMessageHandler({
      setStatus,
      setProgressItems,
      setStatusText,
      setProgressPercent,
      onReady: () => {
        // Model ready
      },
      onComplete: (audioData, samplingRate) => {
        const wavBlob = encodeWav(audioData, samplingRate);
        setFormData((prev) => ({ ...prev, audioBlob: wavBlob, samplingRate }));
        setActiveStep(3);
      },
      setErrorMsg: setErrorMessage,
    });

    workerRef.current.addEventListener("message", handler);

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const nextStep = useCallback(() => setActiveStep((prev) => Math.min(prev + 1, 3)), []);
  const prevStep = useCallback(() => setActiveStep((prev) => Math.max(prev - 1, 1)), []);
  const reset = useCallback(() => {
    setFormData({});
    setActiveStep(1);
    setStatus("initializing");
    setProgressItems({});
    setStatusText("Initializing model...");
    setProgressPercent(0);
    setErrorMessage(null);
  }, []);

  const process = useCallback((params: GenerationParams) => {
    setFormData((prev) => ({ ...prev, params }));
    setActiveStep(2);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "generate",
        text: params.prompt,
        duration: params.duration,
        guidanceScale: params.guidanceScale,
        temperature: params.temperature,
      });
    }
  }, []);

  return (
    <TextToMusicContext.Provider
      value={{
        activeStep,
        setActiveStep,
        nextStep,
        prevStep,
        reset,
        formData,
        setFormData,
        status,
        progressItems,
        statusText,
        progressPercent,
        errorMessage,
        process,
      }}
    >
      {children}
    </TextToMusicContext.Provider>
  );
};

export const useTextToMusic = () => {
  const context = useContext(TextToMusicContext);
  if (!context) {
    throw new Error("useTextToMusic must be used within a TextToMusicProvider");
  }
  return context;
};
