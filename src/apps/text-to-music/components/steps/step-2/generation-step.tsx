import { useTextToMusic } from "../../../context/text-to-music-context";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DownloadProgress } from "@/components/ui/download-progress";
import { GenerationProgress } from "@/apps/text-to-music/components/generation-progress";

export const GenerationStep = () => {
  const { status, progressItems, statusText, progressPercent, errorMessage } = useTextToMusic();

  const hasDownloadItems = Object.keys(progressItems).length > 0;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Download Progress Notification (Shown when downloading model chunks) */}
      {hasDownloadItems && <DownloadProgress progressItems={progressItems} />}

      {/* Generation Progress Indicator */}
      <GenerationProgress
        isGenerating={status !== "error" && status !== "complete"}
        statusText={statusText}
        progressPercent={progressPercent}
      />
    </div>
  );
};
