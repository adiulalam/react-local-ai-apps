import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import WhisperWorker from "@/apps/scribe/workers/whisper.worker?worker";
import SummaryWorker from "@/apps/scribe/workers/summary.worker?worker";
import { createWorkerMessageHandler, type WorkerStatus } from "@/apps/scribe/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { type SummaryMode, SUMMARY_OPTIONS } from "@/types/summary";

export type ScribeState = {
  audioData?: Float32Array;
  transcription?: string;
  summary?: string;
};

type ScribeContextType = {
  formData: ScribeState;
  setFormData: React.Dispatch<React.SetStateAction<ScribeState>>;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  whisperStatus: WorkerStatus;
  whisperProgressItems: Record<string, ProgressInfo>;
  whisperError: string;
  processAudio: (audioData: Float32Array) => void;
  setTranscription: (text: string) => void;

  summaryStatus: WorkerStatus;
  summaryProgressItems: Record<string, ProgressInfo>;
  summaryError: string;
  generateSummary: (transcription: string, mode: SummaryMode) => void;
  setSummary: (text: string) => void;
};

const ScribeContext = createContext<ScribeContextType | undefined>(undefined);

export const useScribeContext = () => {
  const context = useContext(ScribeContext);
  if (!context) {
    throw new Error("useScribeContext must be used within a ScribeProvider");
  }
  return context;
};

const stepsCount = 4;

export const ScribeProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ScribeState>({});
  const [activeStep, setActiveStep] = useState(1);

  const [whisperStatus, setWhisperStatus] = useState<WorkerStatus>("idle");
  const [whisperProgressItems, setWhisperProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [whisperError, setWhisperError] = useState("");

  const [summaryStatus, setSummaryStatus] = useState<WorkerStatus>("idle");
  const [summaryProgressItems, setSummaryProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [summaryError, setSummaryError] = useState("");

  const whisperWorker = useRef<Worker | null>(null);
  const summaryWorker = useRef<Worker | null>(null);

  const whisperListener = useRef<((e: MessageEvent) => void) | null>(null);
  const summaryListener = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    whisperWorker.current = new WhisperWorker();
    summaryWorker.current = new SummaryWorker();

    return () => {
      whisperWorker.current?.terminate();
      summaryWorker.current?.terminate();
    };
  }, []);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, stepsCount));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setFormData({});
    setActiveStep(1);
    setWhisperStatus("idle");
    setSummaryStatus("idle");
    setWhisperProgressItems({});
    setSummaryProgressItems({});
    setWhisperError("");
    setSummaryError("");
    
    // terminate and recreate workers on reset
    whisperWorker.current?.terminate();
    summaryWorker.current?.terminate();
    whisperWorker.current = new WhisperWorker();
    summaryWorker.current = new SummaryWorker();
  };

  const processAudio = (audioData: Float32Array) => {
    setFormData((prev) => ({ ...prev, audioData }));
    setWhisperStatus("initializing");
    setWhisperError("");
    setWhisperProgressItems({});

    if (!whisperWorker.current) {
      whisperWorker.current = new WhisperWorker();
    }

    if (whisperListener.current) {
      whisperWorker.current.removeEventListener("message", whisperListener.current);
    }

    let transcriptionStarted = false;

    whisperListener.current = createWorkerMessageHandler({
      setStatus: setWhisperStatus,
      setProgressItems: setWhisperProgressItems,
      setResultText: (text) => setFormData((prev) => ({ ...prev, transcription: text })),
      onReady: () => {
        if (!transcriptionStarted) {
          transcriptionStarted = true;
          whisperWorker.current?.postMessage({ type: "process", audio: audioData });
        }
      },
      onComplete: (result) => {
        setFormData((prev) => ({ ...prev, transcription: result }));
      },
      setErrorMsg: setWhisperError,
    });

    whisperWorker.current.addEventListener("message", whisperListener.current);
    whisperWorker.current.postMessage({ type: "load" });
  };

  const generateSummary = (transcription: string, mode: SummaryMode) => {
    setSummaryStatus("initializing");
    setSummaryError("");
    setSummaryProgressItems({});
    setFormData((prev) => ({ ...prev, summary: "" }));

    if (!summaryWorker.current) {
      summaryWorker.current = new SummaryWorker();
    }

    if (summaryListener.current) {
      summaryWorker.current.removeEventListener("message", summaryListener.current);
    }

    let summarizationStarted = false;

    summaryListener.current = createWorkerMessageHandler({
      setStatus: setSummaryStatus,
      setProgressItems: setSummaryProgressItems,
      setResultText: (text) => setFormData((prev) => ({ ...prev, summary: text })),
      onReady: () => {
        if (!summarizationStarted) {
          summarizationStarted = true;
          summaryWorker.current?.postMessage({
            type: "process",
            text: transcription,
            options: SUMMARY_OPTIONS[mode],
          });
        }
      },
      onComplete: (result) => {
        setFormData((prev) => ({ ...prev, summary: result }));
      },
      setErrorMsg: setSummaryError,
    });

    summaryWorker.current.addEventListener("message", summaryListener.current);
    summaryWorker.current.postMessage({ type: "load" });
  };

  return (
    <ScribeContext.Provider
      value={{
        formData,
        setFormData,
        activeStep,
        setActiveStep,
        nextStep,
        prevStep,
        reset,
        whisperStatus,
        whisperProgressItems,
        whisperError,
        processAudio,
        setTranscription: (text) => setFormData((prev) => ({ ...prev, transcription: text })),
        summaryStatus,
        summaryProgressItems,
        summaryError,
        generateSummary,
        setSummary: (text) => setFormData((prev) => ({ ...prev, summary: text })),
      }}
    >
      {children}
    </ScribeContext.Provider>
  );
};

