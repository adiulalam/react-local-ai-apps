import { useState, useRef, useEffect } from "react";
import { Film, Loader2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export interface SampleMediaItem {
  name: string;
  url: string;
  type: "image" | "audio" | "video";
  description?: string;
}

export interface SampleMediaSelection {
  url: string;
  blob?: Blob;
  dataUrl?: string;
}

export interface SampleMediaPickerProps {
  items: SampleMediaItem[];
  onSelect?: (selection: SampleMediaSelection) => void;
  onSelectUrl?: (url: string) => void;
  onSelectDataUrl?: (dataUrl: string) => void;
  onSelectBlob?: (blob: Blob) => void;
  label?: string;
  className?: string;
}

export const SampleMediaPicker = ({
  items,
  onSelect,
  onSelectUrl,
  onSelectDataUrl,
  onSelectBlob,
  label = "Or try one of these samples:",
  className,
}: SampleMediaPickerProps) => {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (item: SampleMediaItem) => {
    if (playingUrl === item.url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingUrl(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(item.url);
    audioRef.current = audio;
    setPlayingUrl(item.url);

    audio.play().catch((err) => {
      console.error("Failed to play audio sample", err);
      setPlayingUrl(null);
    });

    audio.onended = () => {
      setPlayingUrl(null);
    };

    audio.onerror = () => {
      setPlayingUrl(null);
    };
  };

  const handleSampleClick = async (item: SampleMediaItem) => {
    setLoadingUrl(item.url);
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : item.url;

        if (onSelect) {
          onSelect({ url: item.url, blob, dataUrl });
        }
        if (onSelectUrl) {
          onSelectUrl(item.url);
        }
        if (onSelectDataUrl) {
          onSelectDataUrl(dataUrl);
        }
        if (onSelectBlob) {
          onSelectBlob(blob);
        }
        setLoadingUrl(null);
      };

      reader.onerror = () => {
        if (onSelect) {
          onSelect({ url: item.url, blob });
        }
        if (onSelectUrl) {
          onSelectUrl(item.url);
        }
        if (onSelectBlob) {
          onSelectBlob(blob);
        }
        setLoadingUrl(null);
      };

      reader.readAsDataURL(blob);
    } catch {
      if (onSelect) {
        onSelect({ url: item.url });
      }
      if (onSelectUrl) {
        onSelectUrl(item.url);
      }
      setLoadingUrl(null);
    }
  };

  const isAudio = items.some((item) => item.type === "audio");

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Muted className="text-xs">{label}</Muted>
      <div
        className={cn("grid w-full gap-3", isAudio ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}
      >
        {items.map((item) => {
          const isLoading = loadingUrl === item.url;

          if (item.type === "image") {
            return (
              <Button
                key={item.name}
                variant="ghost"
                type="button"
                disabled={loadingUrl !== null}
                onClick={() => handleSampleClick(item)}
                className="group relative h-auto border p-1"
              >
                <img src={item.url} alt={item.name} className="h-20 w-full rounded object-cover" />
                <Small className="bg-background/80 absolute right-1 bottom-1 left-1 truncate rounded px-1.5 py-0.5 text-center text-[10px] backdrop-blur-sm">
                  {isLoading ? "Loading..." : item.name}
                </Small>
              </Button>
            );
          }

          if (item.type === "audio") {
            const isPlaying = playingUrl === item.url;

            return (
              <div
                key={item.name}
                className="bg-card text-card-foreground flex w-full items-center justify-between gap-4 rounded-xl border p-4 shadow-xs"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={
                      isPlaying
                        ? `Pause audio preview for ${item.name}`
                        : `Play audio preview for ${item.name}`
                    }
                    onClick={() => handleTogglePlay(item)}
                    className="bg-primary/10 text-primary hover:bg-primary/20 h-10 w-10 shrink-0 rounded-full"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <Small className="block truncate text-sm font-semibold">{item.name}</Small>
                    {item.description && (
                      <Muted className="block truncate text-xs">{item.description}</Muted>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={loadingUrl !== null}
                  onClick={() => handleSampleClick(item)}
                  aria-label={`Select sample ${item.name} for transcription`}
                  className="shrink-0 px-4 text-xs"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            );
          }

          // Video type
          return (
            <Button
              key={item.name}
              variant="outline"
              type="button"
              disabled={loadingUrl !== null}
              onClick={() => handleSampleClick(item)}
              className="flex h-auto flex-col items-start gap-1 p-3 text-left"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="bg-primary/10 text-primary rounded-md p-1.5">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Film className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                {item.description && (
                  <Small className="text-muted-foreground text-[10px]">{item.description}</Small>
                )}
              </div>
              <Small className="w-full truncate font-medium">
                {isLoading ? "Loading..." : item.name}
              </Small>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
