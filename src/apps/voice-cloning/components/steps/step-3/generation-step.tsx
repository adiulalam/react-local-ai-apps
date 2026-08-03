import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadProgress } from "@/components/ui/download-progress";
import { GenerationProgress } from "@/apps/voice-cloning/components/generation-progress";
import { useVoiceCloning } from "../../../context/voice-cloning-context";

export const GenerationStep = () => {
  const {
    workerStatus,
    progressItems,
    statusText,
    progressPercent,
    errorMessage,
    generateVoice,
    updateState,
    nextStep,
  } = useVoiceCloning();

  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;

    generateVoice()
      .then(({ audioBlob, samplingRate }) => {
        updateState({ audioBlob, samplingRate });
        nextStep();
      })
      .catch((error) => {
        console.error("Generation failed:", error);
      });
  }, [generateVoice, updateState, nextStep]);

  const hasDownloadItems = Object.keys(progressItems).length > 0;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {hasDownloadItems && <DownloadProgress progressItems={progressItems} />}

      <GenerationProgress
        isGenerating={workerStatus !== "error" && workerStatus !== "complete"}
        statusText={statusText}
        progressPercent={progressPercent}
      />
    </div>
  );
};
