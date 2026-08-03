import { useEffect, useRef, useCallback } from "react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { Muted, Small } from "@/components/ui/typography";
import type { DetectionResult } from "@/apps/object-detection/utils/worker-message-handler";
import { useObjectDetectionContext } from "@/apps/object-detection/context/object-detection-context";

export const DetectionStep = () => {
  const {
    formData,
    status,
    errorMsg,
    progressItems,
    loadModel,
    processImage,
    setDetectionCallback,
    isModelLoaded,
  } = useObjectDetectionContext();
  const { videoUrl, useWebcam } = formData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBoxes = useCallback((predictions: DetectionResult[]) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);

    predictions.forEach((pred) => {
      const { xmin, ymin, xmax, ymax } = pred.box;
      const x = xmin * width;
      const y = ymin * height;
      const w = (xmax - xmin) * width;
      const h = (ymax - ymin) * height;

      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
      ctx.fillRect(x, y - 20, ctx.measureText(pred.label).width + 50, 20);

      ctx.fillStyle = "#000000";
      ctx.font = "14px Arial";
      ctx.fillText(`${pred.label} (${(pred.score * 100).toFixed(1)}%)`, x + 5, y - 5);
    });
  }, []);

  const processFrame = useCallback(() => {
    function doProcess() {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        requestAnimationFrame(doProcess);
        return;
      }

      const { videoWidth, videoHeight } = video;
      if (canvasRef.current.width !== videoWidth) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

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
      const imageData = tempCanvas.toDataURL("image/jpeg", 0.5);

      processImage(imageData, 0.5);
    }

    doProcess();
  }, [processImage]);

  useEffect(() => {
    setDetectionCallback((result) => {
      drawBoxes(result);
      requestAnimationFrame(processFrame);
    });
  }, [drawBoxes, processFrame, setDetectionCallback]);

  useEffect(() => {
    if (!isModelLoaded) {
      loadModel();
    } else if (status === "idle") {
      processFrame();
    }
  }, [isModelLoaded, loadModel, status, processFrame]);

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
          console.error("Failed to access webcam. Please check permissions.");
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
