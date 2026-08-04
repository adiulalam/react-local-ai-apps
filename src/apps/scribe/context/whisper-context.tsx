import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import WhisperWorker from "@/apps/scribe/workers/whisper.worker?worker";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/scribe/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { useScribeFormContext } from "./scribe-context";

type WhisperContextType = {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  error: string;
  processAudio: (audioData: Float32Array) => void;
  resetWorker: () => void;
};

const WhisperContext = createContext<WhisperContextType | undefined>(undefined);

export const useWhisperContext = () => {
  const context = useContext(WhisperContext);
  if (!context) {
    throw new Error("useWhisperContext must be used within a WhisperProvider");
  }
  return context;
};

export const WhisperProvider = ({ children }: { children: ReactNode }) => {
  const { setFormData } = useScribeFormContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [error, setError] = useState("");

  const whisperWorker = useRef<Worker | null>(null);
  const whisperListener = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    whisperWorker.current = new WhisperWorker();
    return () => {
      whisperWorker.current?.terminate();
    };
  }, []);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setError("");
  };

  const processAudio = (audioData: Float32Array) => {
    setFormData((prev) => ({ ...prev, audioData }));
    setStatus("initializing");
    setError("");
    setProgressItems({});

    if (!whisperWorker.current) {
      whisperWorker.current = new WhisperWorker();
    }

    if (whisperListener.current) {
      whisperWorker.current.removeEventListener("message", whisperListener.current);
    }

    let transcriptionStarted = false;

    whisperListener.current = createWorkerMessageHandler({
      setStatus: setStatus,
      setProgressItems: setProgressItems,
      setResultText: (updater) =>
        setFormData((prev) => ({ ...prev, transcription: updater(prev.transcription || "") })),
      onReady: () => {
        if (!transcriptionStarted) {
          transcriptionStarted = true;
          whisperWorker.current?.postMessage({ type: "process", audio: audioData });
        }
      },
      onComplete: (result) => {
        setFormData((prev) => ({ ...prev, transcription: result }));
      },
      setErrorMsg: setError,
    });

    whisperWorker.current.addEventListener("message", whisperListener.current);
    whisperWorker.current.postMessage({ type: "load" });
  };

  return (
    <WhisperContext.Provider
      value={{
        status,
        progressItems,
        error,
        processAudio,
        resetWorker,
      }}
    >
      {children}
    </WhisperContext.Provider>
  );
};
