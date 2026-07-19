import { useState, useEffect, useRef } from "react";
import { Download, RefreshCw } from "lucide-react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
} from "@/apps/image-classifier/utils/worker-message-handler";
import BackgroundRemoverWorker from "@/apps/background-remover/workers/background-remover.worker?worker";

interface RemovalResult {
  maskData: Uint8Array;
  width: number;
  height: number;
}

interface RemovalStepProps {
  imageDataUrl: string;
}

export const RemovalStep = ({ imageDataUrl }: RemovalStepProps) => {
  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [resultImage, setResultImage] = useState<string | null>(null);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    let processingStarted = false;

    if (!imageDataUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No image data provided. Please ensure Step 1 completed successfully.");
      return;
    }

    if (!worker.current) {
      worker.current = new BackgroundRemoverWorker();

      const messageHandler = createWorkerMessageHandler<RemovalResult>({
        setStatus,
        setProgressItems,
        onReady: () => {
          if (!processingStarted) {
            processingStarted = true;
            worker.current?.postMessage({ type: "process", image: imageDataUrl });
          }
        },
        onComplete: async (result) => {
          const { maskData, width, height } = result;
          
          // Create an offscreen image to get the original pixels
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = imageDataUrl;
          
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            
            // Draw original image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Update alpha channel
            const pixelData = ctx.getImageData(0, 0, width, height);
            for (let i = 0; i < maskData.length; ++i) {
              pixelData.data[4 * i + 3] = maskData[i];
            }
            ctx.putImageData(pixelData, 0, 0);
            
            setResultImage(canvas.toDataURL("image/png"));
          };
        },
        setErrorMsg,
      });

      worker.current.addEventListener("message", messageHandler);
      worker.current.postMessage({ type: "load" });
    }

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, [imageDataUrl]);

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

      {status === "loading" && (
        <Muted>Downloading WebGPU models... This only happens once.</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <Muted>Removing background... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {status === "complete" && resultImage && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H3>Original Image</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2 bg-[url('/checkerboard.png')] bg-repeat">
              <img
                src={imageDataUrl}
                alt="Original"
                className="max-h-64 rounded-md object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <H3>Result</H3>
            <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2 bg-[url('/checkerboard.png')] bg-repeat">
              <img
                src={resultImage}
                alt="Background Removed"
                className="max-h-64 rounded-md object-contain bg-transparent"
                style={{
                  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%)',
                  backgroundSize: '20px 20px'
                }}
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
