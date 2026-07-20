import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Muted, Small } from "@/components/ui/typography";
import { Progress } from "@/components/ui/progress";
import ObjectDetectionWorker from "@/apps/object-detection/workers/object-detection.worker?worker";

interface DetectionStepProps {
  videoUrl?: string;
  useWebcam?: boolean;
}

interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface DetectionResult {
  score: number;
  label: string;
  box: BoundingBox;
}

export const DetectionStep = ({ videoUrl, useWebcam }: DetectionStepProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [status, setStatus] = useState<"loading_model" | "ready" | "error">("loading_model");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

      // Set canvas dimensions to match video exactly
      const { videoWidth, videoHeight } = video;
      if (canvasRef.current.width !== videoWidth) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      // Create a temporary canvas to get ImageData
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = videoWidth;
      tempCanvas.height = videoHeight;
      const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      const imageData = tempCanvas.toDataURL("image/jpeg", 0.5); // lower quality for speed

      workerRef.current.postMessage({ type: "process", image: imageData, threshold: 0.5 });
    }

    doProcess();
  }, []);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new ObjectDetectionWorker();

    const onMessageReceived = (e: MessageEvent) => {
      const { type, data, result, error } = e.data;
      switch (type) {
        case "progress":
          if (data?.progress) setProgress(Math.round(data.progress));
          break;
        case "ready":
          setStatus("ready");
          break;
        case "complete":
          drawBoxes(result);
          // Request next frame process
          requestAnimationFrame(processFrame);
          break;
        case "error":
          setStatus("error");
          setError(error);
          break;
      }
    };

    workerRef.current.addEventListener("message", onMessageReceived);
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
            videoRef.current.play();
          }
        })
        .catch(() => {
          setStatus("error");
          setError("Failed to access webcam. Please check permissions.");
        });
    } else if (videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.play();
    }

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [useWebcam, videoUrl]);

  // Start processing when ready
  useEffect(() => {
    if (status === "ready") {
      processFrame();
    }
  }, [status, processFrame]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {status === "loading_model" && (
        <div className="flex w-full flex-col items-center space-y-4 py-12">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <Small>Downloading AI Model ({progress}%)</Small>
          <Progress value={progress} className="w-[60%]" />
        </div>
      )}

      {status === "error" && (
        <div className="text-destructive py-12 text-center">
          <Small>Error</Small>
          <Muted>{error}</Muted>
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-lg border ${status === "ready" ? "block" : "hidden"}`}
      >
        <video
          ref={videoRef}
          className="max-h-150 w-auto max-w-full"
          playsInline
          muted={useWebcam}
          loop={!useWebcam}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute top-0 left-0 h-full w-full object-contain"
        />
      </div>
    </div>
  );
};
