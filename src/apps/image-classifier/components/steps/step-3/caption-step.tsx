import { DownloadProgress } from "@/components/ui/download-progress";
import { H3, Muted } from "@/components/ui/typography";
import { useImageClassifierFormContext } from "../../../context/image-classifier-context";
import { useImageCaptioningContext } from "../../../context/image-captioning-context";

export const CaptionStep = () => {
  const { imageDataUrl, caption } = useImageClassifierFormContext();
  const { status, error: errorMsg, progressItems } = useImageCaptioningContext();

  if (!imageDataUrl) {
    return (
      <p className="text-destructive text-sm">
        No image data provided. Please ensure previous steps completed successfully.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && (
        <Muted>Checking cache and downloading required model chunks...</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Muted>Generating caption locally... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {status === "complete" && caption && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H3>Uploaded Image</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
              <img
                src={imageDataUrl}
                alt="Uploaded for captioning"
                className="max-h-64 rounded-md object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <H3>Caption Description</H3>
            <div className="bg-primary/5 rounded-lg border p-6 shadow-sm">
              <p
                data-testid="caption-text"
                className="text-foreground text-center text-lg font-medium italic"
              >
                "{caption}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
