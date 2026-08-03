import { useState } from "react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { ModeSelector } from "./mode-selector";
import { SummaryDisplay } from "./summary-display";
import { type SummaryMode } from "@/types/summary";
import { useScribeContext } from "../../../context/scribe-context";

export const SummarizationStep = () => {
  const {
    formData,
    summaryStatus: status,
    summaryError: errorMsg,
    summaryProgressItems: progressItems,
    generateSummary,
    setSummary,
    nextStep,
  } = useScribeContext();

  const [mode, setMode] = useState<SummaryMode>("Default");
  const transcription = formData.transcription || "";
  const summary = formData.summary || "";

  const handleGenerate = () => {
    generateSummary(transcription, mode);
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
        onContinue={nextStep}
      />
    </div>
  );
};

