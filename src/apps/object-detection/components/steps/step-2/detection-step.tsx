import { useEffect, useRef, useState, useCallback } from "react";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { Muted, Small } from "@/components/ui/typography";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type DetectionResult,
} from "@/apps/object-detection/utils/worker-message-handler";
import ObjectDetectionWorker from "@/apps/object-detection/workers/object-detection.worker?worker";

interface DetectionStepProps {
  videoUrl?: string;
  useWebcam?: boolean;
}

export const DetectionStep = ({ videoUrl, useWebcam }: DetectionStepProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [status, setStatus] = useState<WorkerStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});

  const drawBoxes = useCallback((predictions: DetectionResult[]) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);

    predictions.forEach((pred) => {
      // The box format depends on the model. Usually it's { xmin, ymin, xmax, ymax }
      // Since we requested percentage: true, coordinates are 0-1
      const { xmin, ymin, xmax, ymax } = pred.box;
      const x = xmin * width;
      const y = ymin * height;
      const w = (xmax - xmin) * width;
      const h = (ymax - ymin) * height;

      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
      ctx.fillRect(x, y - 20, ctx.measureText(pred.label).width + 50, 20);

      // Label text
      ctx.fillStyle = "#000000";
      ctx.font = "14px Arial";
      ctx.fillText(`${pred.label} (${(pred.score * 100).toFixed(1)}%)`, x + 5, y - 5);
    });
  }, []);

  const processFrame = useCallback(() => {
    function doProcess() {
      if (!videoRef.current || !canvasRef.current || !workerRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        requestAnimationFrame(doProcess);
        return;
      }

      // Set display canvas dimensions to match video exactly
      const { videoWidth, videoHeight } = video;
      if (canvasRef.current.width !== videoWidth) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      // Create a temporary canvas and scale down the image for faster IPC and processing
      const MAX_DIM = 480;
      const scale = Math.min(MAX_DIM / videoWidth, MAX_DIM / videoHeight, 1);
      const tempWidth = videoWidth * scale;
      const tempHeight = videoHeight * scale;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = tempWidth;
      tempCanvas.height = tempHeight;
      const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, tempWidth, tempHeight);
      const imageData = tempCanvas.toDataURL("image/jpeg", 0.5); // lower quality for speed

      workerRef.current.postMessage({ type: "process", image: imageData, threshold: 0.5 });
    }

    doProcess();
  }, []);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new ObjectDetectionWorker();

    const messageHandler = createWorkerMessageHandler<DetectionResult[]>({
      setStatus,
      setProgressItems,
      onReady: () => {
        setStatus("idle");
        processFrame();
      },
      onComplete: async (result) => {
        drawBoxes(result);
        requestAnimationFrame(processFrame);
      },
      setErrorMsg,
    });

    workerRef.current.addEventListener("message", messageHandler);
    workerRef.current.postMessage({ type: "load" });

    return () => {
      workerRef.current?.terminate();
    };
  }, [drawBoxes, processFrame]);

  // Setup Video Stream
  useEffect(() => {
    if (!videoRef.current) return;

    let stream: MediaStream | null = null;

    if (useWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch((e) => {
              if (e.name !== "AbortError") console.error("Webcam play error:", e);
            });
          }
        })
        .catch(() => {
          setStatus("error");
          setErrorMsg("Failed to access webcam. Please check permissions.");
        });
    } else if (videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.play().catch((e) => {
        if (e.name !== "AbortError") console.error("Video play error:", e);
      });
    }

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [useWebcam, videoUrl]);

  // Start processing is now handled in onReady

  return (
    <div className="flex flex-col items-center space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && <Muted>Downloading WebGPU models... This only happens once.</Muted>}

      {status === "error" && (
        <div className="text-destructive py-12 text-center">
          <Small>Error</Small>
          <Muted>{errorMsg}</Muted>
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-lg border ${status === "idle" || status === "processing" || status === "complete" ? "block" : "hidden"}`}
      >
        <video
          ref={videoRef}
          className="max-h-150 w-auto max-w-full"
          playsInline
          muted={useWebcam}
          loop={!useWebcam}
          data-testid="detection-video"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute top-0 left-0 h-full w-full object-contain"
          data-testid="detection-canvas"
        />
      </div>
    </div>
  );
};
