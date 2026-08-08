import { useState } from "react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { ModeSelector } from "./mode-selector";
import { SummaryDisplay } from "./summary-display";
import { type SummaryMode } from "@/types/summary";
import { useScribeFormContext } from "@/apps/scribe/context/scribe-context";
import { useSummaryContext } from "@/apps/scribe/context/summary-context";

export const SummarizationStep = () => {
  const { formData, setSummary, nextStep } = useScribeFormContext();
  const { status, error: errorMsg, progressItems, generateSummary } = useSummaryContext();

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
