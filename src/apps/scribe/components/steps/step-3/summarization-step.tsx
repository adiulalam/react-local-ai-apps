import { useState, useEffect, useRef } from "react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { ModeSelector } from "./mode-selector";
import { SummaryDisplay } from "./summary-display";
import { type SummaryMode, SUMMARY_OPTIONS } from "@/types/summary";

interface SummarizationStepProps {
  transcription: string;
  onNext: (summary: string) => void;
}

type Status = "idle" | "initializing" | "loading" | "processing" | "complete" | "error";

export const SummarizationStep = ({ transcription, onNext }: SummarizationStepProps) => {
  const [summary, setSummary] = useState("");
  const [mode, setMode] = useState<SummaryMode>("Default");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});

  const worker = useRef<Worker | null>(null);
  const summarizationStarted = useRef(false);

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
    if (!worker.current) {
      worker.current = new Worker(
        new URL("../../../lib/workers/summary.worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.current.addEventListener("message", (e) => {
        const msg = e.data;

        switch (msg.type) {
          case "progress":
            setStatus("loading");
            setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
            break;
          case "ready":
            setProgressItems({}); // Clear download progress
            if (!summarizationStarted.current) {
              summarizationStarted.current = true;
              worker.current?.postMessage({
                type: "process",
                text: transcription,
                options: SUMMARY_OPTIONS[mode],
              });
            }
            break;
          case "processing":
            setStatus("processing");
            break;
          case "update":
            setSummary((prev) => prev + msg.output);
            break;
          case "complete":
            setStatus("complete");
            setSummary(msg.result);
            break;
          case "error":
            setStatus("error");
            setErrorMsg(msg.error);
            break;
        }
      });
    }

    setStatus("initializing");
    setSummary("");
    summarizationStarted.current = false;
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
