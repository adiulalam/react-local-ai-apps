import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { DownloadProgress } from "@/components/ui/download-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Muted, Small } from "@/components/ui/typography";
import { useVideoCaptioningContext } from "@/apps/video-captioning/context/video-captioning-context";

export const ProcessingStep = () => {
  const { status, errorMsg, progressItems, captionProgress, processAudio } =
    useVideoCaptioningContext();

  useEffect(() => {
    processAudio();
  }, [processAudio]);

  return (
    <div className="space-y-6">
      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {status === "loading" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Small>Downloading model files...</Small>
          </div>
          <DownloadProgress progressItems={progressItems} />
        </div>
      )}

      {(status === "initializing" || status === "processing" || status === "complete") && (
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <Muted>
            {status === "initializing"
              ? "Initializing..."
              : captionProgress?.statusText || "Transcribing audio..."}
          </Muted>
          {status === "processing" && captionProgress && (
            <Progress value={captionProgress.progress} className="mt-4 h-2 w-full" />
          )}
        </div>
      )}
    </div>
  );
};
