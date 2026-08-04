import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import SummaryWorker from "@/apps/scribe/workers/summary.worker?worker";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/scribe/utils/worker-message-handler";
import { type ProgressInfo } from "@/components/ui/download-progress";
import { type SummaryMode, SUMMARY_OPTIONS } from "@/types/summary";
import { useScribeFormContext } from "./scribe-context";

type SummaryContextType = {
  status: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  error: string;
  generateSummary: (transcription: string, mode: SummaryMode) => void;
  resetWorker: () => void;
};

const SummaryContext = createContext<SummaryContextType | undefined>(undefined);

export const useSummaryContext = () => {
  const context = useContext(SummaryContext);
  if (!context) {
    throw new Error("useSummaryContext must be used within a SummaryProvider");
  }
  return context;
};

export const SummaryProvider = ({ children }: { children: ReactNode }) => {
  const { setFormData } = useScribeFormContext();
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [error, setError] = useState("");

  const summaryWorker = useRef<Worker | null>(null);
  const summaryListener = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    summaryWorker.current = new SummaryWorker();
    return () => {
      summaryWorker.current?.terminate();
    };
  }, []);

  const resetWorker = () => {
    setStatus("idle");
    setProgressItems({});
    setError("");
  };

  const generateSummary = (transcription: string, mode: SummaryMode) => {
    setStatus("initializing");
    setError("");
    setProgressItems({});
    setFormData((prev) => ({ ...prev, summary: "" }));

    if (!summaryWorker.current) {
      summaryWorker.current = new SummaryWorker();
    }

    if (summaryListener.current) {
      summaryWorker.current.removeEventListener("message", summaryListener.current);
    }

    let summarizationStarted = false;

    summaryListener.current = createWorkerMessageHandler({
      setStatus: setStatus,
      setProgressItems: setProgressItems,
      setResultText: (updater) =>
        setFormData((prev) => ({ ...prev, summary: updater(prev.summary || "") })),
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
      setErrorMsg: setError,
    });

    summaryWorker.current.addEventListener("message", summaryListener.current);
    summaryWorker.current.postMessage({ type: "load" });
  };

  return (
    <SummaryContext.Provider
      value={{
        status,
        progressItems,
        error,
        generateSummary,
        resetWorker,
      }}
    >
      {children}
    </SummaryContext.Provider>
  );
};
