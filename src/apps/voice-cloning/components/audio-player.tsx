import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Download, MicVocal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Muted, Small, H4 } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";

type AudioPlayerProps = {
  audioBlob: Blob;
  prompt: string;
  samplingRate?: number;
};

export const AudioPlayer = ({ audioBlob, prompt, samplingRate = 24000 }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = useMemo(() => {
    if (!audioBlob) return "";
    return URL.createObjectURL(audioBlob);
  }, [audioBlob]);

  useEffect(() => {
    if (!audioUrl) return;
    if (audioRef.current) {
      audioRef.current.load();
    }
    return () => {
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 10000);
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err: unknown) {
      console.error("Audio playback error:", err);
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    const sanitizedPrompt = prompt.slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, "_") || "cloned_speech";
    a.download = `voice_cloned_${sanitizedPrompt}_${Date.now()}.wav`;
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
              <MicVocal className="text-primary size-4" />
              <H4 className="text-sm font-semibold">Generated Cloned Speech</H4>
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
                aria-label="Playback progress"
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
            <Small className="text-[11px]">Format: 16-bit PCM WAV</Small>
            <Small className="text-[11px]">Sample Rate: {samplingRate} Hz</Small>
            <Small className="text-[11px]">Channels: Mono</Small>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
