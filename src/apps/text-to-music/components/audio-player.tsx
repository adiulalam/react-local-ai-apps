import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Download, Music, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Muted, Small, H4 } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";

type AudioPlayerProps = {
  audioBlob: Blob;
  audioData?: Float32Array;
  prompt: string;
  duration: number;
  samplingRate?: number;
  onReset?: () => void;
};

export const AudioPlayer = ({
  audioBlob,
  audioData,
  prompt,
  duration,
  samplingRate = 32000,
  onReset,
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const audioUrl = useMemo(() => {
    return URL.createObjectURL(audioBlob);
  }, [audioBlob]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
    return () => {
      URL.revokeObjectURL(audioUrl);
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Ignore if source is already stopped
        }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  const playWebAudio = () => {
    if (!audioData) return false;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtxClass({ sampleRate: samplingRate });
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Ignore if source is already stopped
        }
      }

      const buffer = audioCtxRef.current.createBuffer(1, audioData.length, samplingRate);
      buffer.getChannelData(0).set(audioData);

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);

      const offset = currentTime < totalDuration ? currentTime : 0;
      source.start(0, offset);
      startTimeRef.current = audioCtxRef.current.currentTime - offset;
      sourceNodeRef.current = source;
      setIsPlaying(true);

      const updateProgress = () => {
        if (!audioCtxRef.current) return;
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        if (elapsed >= buffer.duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        } else {
          setCurrentTime(elapsed);
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);

      source.onended = () => {
        setIsPlaying(false);
      };
      return true;
    } catch (e) {
      console.error("WebAudio playback failed:", e);
      return false;
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Ignore if source is already stopped
        }
      }
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.warn("HTML5 audio play failed, falling back to Web Audio API:", err);
      }
    }

    playWebAudio();
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    const sanitizedPrompt = prompt.slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, "_") || "music";
    a.download = `musicgen_${sanitizedPrompt}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Card className="border-primary/20 bg-card overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-6">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setTotalDuration(audioRef.current.duration);
            }
          }}
        />

        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Music className="text-primary size-4" />
              <H4 className="text-sm font-semibold">Generated Track</H4>
            </div>
            <Muted className="text-xs italic">"{prompt}"</Muted>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="size-3.5" />
              Download WAV
            </Button>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 text-xs">
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
            </Button>

            <div className="flex-1 space-y-1">
              <Slider
                value={[currentTime]}
                min={0}
                max={totalDuration || 1}
                step={0.1}
                onValueChange={(val) => {
                  const targetTime = Array.isArray(val) ? val[0] : val;
                  setCurrentTime(targetTime);
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetTime;
                  }
                }}
              />
              <div className="text-muted-foreground flex justify-between font-mono text-[11px]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-4 border-t pt-1 text-xs">
            <Small className="text-[11px]">Format: 32-bit Float WAV</Small>
            <Small className="text-[11px]">Sample Rate: {samplingRate} Hz</Small>
            <Small className="text-[11px]">Channels: Mono</Small>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
