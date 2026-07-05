import { useState, useEffect, useRef } from "react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { ModeSelector } from "./mode-selector";
import { SummaryDisplay } from "./summary-display";
import { type SummaryMode, SUMMARY_OPTIONS } from "@/types/summary";
import { createWorkerMessageHandler, type WorkerStatus } from "@/apps/scribe/utils/worker-message-handler";

interface SummarizationStepProps {
  transcription: string;
  onNext: (summary: string) => void;
}

export const SummarizationStep = ({ transcription, onNext }: SummarizationStepProps) => {
  const [summary, setSummary] = useState("");
  const [mode, setMode] = useState<SummaryMode>("Default");
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!transcription || transcription.trim() === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No transcription provided. Please ensure Step 2 completed successfully.");
    }

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, [transcription]);

  const handleGenerate = () => {
    if (worker.current) {
      worker.current.terminate();
    }

    worker.current = new Worker(
      new URL("../../../../../lib/workers/summary.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );

    let summarizationStarted = false;

    const messageHandler = createWorkerMessageHandler({
      setStatus,
      setProgressItems,
      setResultText: setSummary,
      onReady: () => {
        if (!summarizationStarted) {
          summarizationStarted = true;
          worker.current?.postMessage({
            type: "process",
            text: transcription,
            options: SUMMARY_OPTIONS[mode],
          });
        }
      },
      onComplete: (result) => setSummary(result),
      setErrorMsg,
    });

    worker.current.addEventListener("message", messageHandler);

    setStatus("initializing");
    setSummary("");
    worker.current.postMessage({ type: "load" });
  };

  return (
    <div className="space-y-6">
      <DownloadProgress progressItems={progressItems} />

      {status === "idle" && (
        <ModeSelector mode={mode} onModeChange={setMode} onGenerate={handleGenerate} />
      )}

      <SummaryDisplay
        status={status}
        summary={summary}
        onSummaryChange={setSummary}
        errorMsg={errorMsg}
        onContinue={() => onNext(summary)}
      />
    </div>
  );
};
