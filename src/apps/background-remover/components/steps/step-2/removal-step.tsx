import { useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useBackgroundRemover } from "@/apps/background-remover/context/background-remover-context";

export const RemovalStep = () => {
  const { formData, status, errorMsg, progressItems, resultImage, processImage } =
    useBackgroundRemover();
  const { imageDataUrl } = formData;

  useEffect(() => {
    if (imageDataUrl && status === "idle") {
      processImage(imageDataUrl);
    }
  }, [imageDataUrl, status, processImage]);

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = "background-removed.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && <Muted>Downloading WebGPU models... This only happens once.</Muted>}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin" />
          <Muted>Removing background... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && (
        <p className="text-destructive text-sm">
          {errorMsg || "No image data provided. Please ensure Step 1 completed successfully."}
        </p>
      )}

      {status === "complete" && resultImage && imageDataUrl && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H3>Original Image</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
              <img
                src={imageDataUrl}
                alt="Original"
                className="max-h-64 rounded-md object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <H3>Result</H3>
            <div
              className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(rgba(128, 128, 128, 0.15) 0% 25%, transparent 0% 50%)",
                backgroundSize: "20px 20px",
              }}
            >
              <img
                src={resultImage}
                alt="Background Removed"
                className="max-h-64 rounded-md bg-transparent object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleDownload} variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
