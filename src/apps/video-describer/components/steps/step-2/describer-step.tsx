import { useEffect, useRef, useCallback } from "react";
import { Sparkles, Volume2, VolumeX, History, Play, Pause, Clock } from "lucide-react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { H3, Muted, P, Small } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVideoDescriberContext } from "@/apps/video-describer/context/video-describer-context";

export const DescriberStep = () => {
  const {
    formData,
    status,
    errorMsg,
    progressItems,
    loadModel,
    describeFrame,
    isModelLoaded,
    currentDescription,
    history,
    isAutoNarrate,
    setIsAutoNarrate,
    isTtsEnabled,
    setIsTtsEnabled,
    narrationInterval,
    setNarrationInterval,
    speakText,
    stopSpeech,
  } = useVideoDescriberContext();

  const { videoUrl, useWebcam } = formData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoNarrateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capture frame from video element and send to Web Worker
  const captureAndDescribe = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;

    if (video.readyState < 2) return;

    const { videoWidth, videoHeight, currentTime } = video;
    if (!videoWidth || !videoHeight) return;

    const canvas = canvasRef.current;
    const MAX_DIM = 512;
    const scale = Math.min(MAX_DIM / videoWidth, MAX_DIM / videoHeight, 1);
    const targetWidth = Math.round(videoWidth * scale);
    const targetHeight = Math.round(videoHeight * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const imageData = canvas.toDataURL("image/jpeg", 0.7);

    describeFrame(imageData, useWebcam ? undefined : Math.round(currentTime));
  }, [describeFrame, useWebcam]);

  // Load model when entering step
  useEffect(() => {
    if (!isModelLoaded) {
      loadModel();
    }
  }, [isModelLoaded, loadModel]);

  // Handle Auto-Narration Timer
  useEffect(() => {
    if (isAutoNarrate && isModelLoaded && status !== "loading") {
      // Capture first frame immediately
      captureAndDescribe();

      autoNarrateTimerRef.current = setInterval(() => {
        captureAndDescribe();
      }, narrationInterval * 1000);
    } else {
      if (autoNarrateTimerRef.current) {
        clearInterval(autoNarrateTimerRef.current);
        autoNarrateTimerRef.current = null;
      }
    }

    return () => {
      if (autoNarrateTimerRef.current) {
        clearInterval(autoNarrateTimerRef.current);
        autoNarrateTimerRef.current = null;
      }
    };
  }, [isAutoNarrate, isModelLoaded, status, narrationInterval, captureAndDescribe]);

  // Setup Video / Webcam Stream only once model is loaded
  useEffect(() => {
    if (!isModelLoaded || !videoRef.current) return;

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
      stopSpeech();
    };
  }, [isModelLoaded, useWebcam, videoUrl, stopSpeech]);

  // If model is still downloading or initializing, show download progress only
  if (!isModelLoaded && (status === "initializing" || status === "loading")) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <DownloadProgress progressItems={progressItems} />
        {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}
        {status === "loading" && (
          <Muted>Downloading AI Vision models... This only happens on first load.</Muted>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-destructive py-12 text-center">
        <Small className="block font-semibold">Error</Small>
        <Muted>{errorMsg}</Muted>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Video Preview & Canvas Viewport */}
        <div className="flex flex-col items-center space-y-4 lg:col-span-7">
          <div className="bg-background relative w-full overflow-hidden rounded-xl border shadow-inner">
            <video
              ref={videoRef}
              className="max-h-[380px] w-full object-contain"
              playsInline
              controls={!useWebcam}
              muted={useWebcam}
              loop={!useWebcam}
              data-testid="describer-video"
            />
            {/* Hidden canvas used for extracting frame imageData */}
            <canvas ref={canvasRef} className="hidden" data-testid="describer-canvas" />
          </div>

          {/* Controls Bar */}
          <div className="bg-card flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm">
            <Button
              onClick={captureAndDescribe}
              disabled={status === "loading" || status === "processing"}
              className="gap-2"
              data-testid="describe-now-btn"
            >
              <Sparkles className="h-4 w-4" />
              {status === "processing" ? "Analyzing..." : "Describe Scene Now"}
            </Button>

            <div className="flex items-center gap-6">
              {/* Auto-Narrate Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-narrate"
                  checked={isAutoNarrate}
                  onCheckedChange={setIsAutoNarrate}
                  disabled={status === "loading"}
                />
                <Label htmlFor="auto-narrate" className="cursor-pointer text-sm font-medium">
                  {isAutoNarrate ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Play className="h-3.5 w-3.5 fill-current" /> Auto-Narrating
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Pause className="h-3.5 w-3.5" /> Auto-Narrate
                    </span>
                  )}
                </Label>
              </div>

              {/* Interval Select */}
              {isAutoNarrate && (
                <div className="flex items-center gap-1.5">
                  <Clock className="text-muted-foreground h-3.5 w-3.5" />
                  <Select
                    value={String(narrationInterval)}
                    onValueChange={(val) => setNarrationInterval(Number(val))}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue placeholder="Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Every 3s</SelectItem>
                      <SelectItem value="5">Every 5s</SelectItem>
                      <SelectItem value="10">Every 10s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Voice TTS Switch */}
              <div className="flex items-center space-x-2">
                <Switch id="voice-tts" checked={isTtsEnabled} onCheckedChange={setIsTtsEnabled} />
                <Label htmlFor="voice-tts" className="cursor-pointer text-sm font-medium">
                  {isTtsEnabled ? (
                    <span className="text-primary flex items-center gap-1">
                      <Volume2 className="h-4 w-4" /> Voice Narration
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <VolumeX className="h-4 w-4" /> Muted
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Scene Description & Live Timeline Log */}
        <div className="flex flex-col space-y-4 lg:col-span-5">
          {/* Active Scene Description Card */}
          <Card className="border-primary/20 bg-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" />
                  <Small className="font-semibold">Current Scene Description</Small>
                </div>
                {status === "processing" && (
                  <Badge variant="secondary" className="animate-pulse text-xs">
                    Processing frame...
                  </Badge>
                )}
              </div>

              {currentDescription ? (
                <div className="space-y-3">
                  <P className="bg-muted/40 rounded-lg p-3 text-base leading-relaxed font-medium">
                    "{currentDescription}"
                  </P>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speakText(currentDescription)}
                      className="gap-1.5 text-xs"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Speak Again
                    </Button>
                  </div>
                </div>
              ) : (
                <Muted className="block py-6 text-center text-xs">
                  Click "Describe Scene Now" or toggle "Auto-Narrate" to analyze video frames.
                </Muted>
              )}
            </CardContent>
          </Card>

          {/* Narration History Log */}
          <Card className="flex flex-1 flex-col">
            <CardContent className="flex flex-1 flex-col space-y-3 p-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <History className="text-muted-foreground h-4 w-4" />
                <H3 className="text-sm font-semibold">Narration Timeline</H3>
                <Badge variant="outline" className="ml-auto text-xs">
                  {history.length} {history.length === 1 ? "entry" : "entries"}
                </Badge>
              </div>

              <div className="max-h-[220px] flex-1 space-y-2 overflow-y-auto pr-1">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-muted/30 hover:bg-muted/60 flex items-start justify-between gap-3 rounded-lg border p-2.5 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {item.timeInSeconds !== undefined
                              ? `${Math.floor(item.timeInSeconds / 60)}:${String(item.timeInSeconds % 60).padStart(2, "0")}`
                              : item.timestamp}
                          </Badge>
                        </div>
                        <P className="text-xs leading-normal">{item.text}</P>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => speakText(item.text)}
                        aria-label={`Speak: ${item.text}`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <Muted className="block py-8 text-center text-xs">
                    No descriptions recorded yet.
                  </Muted>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
