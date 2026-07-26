import { useState, useRef, useEffect } from "react";
import { Film, Loader2, Play, Pause, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export interface SampleMediaItem {
  name: string;
  url?: string;
  type: "image" | "audio" | "video" | "text";
  description?: string;
  text?: string;
}

export interface SampleMediaSelection {
  url?: string;
  blob?: Blob;
  dataUrl?: string;
  text?: string;
}

export interface SampleMediaPickerProps {
  items: SampleMediaItem[];
  onSelect?: (selection: SampleMediaSelection) => void;
  onSelectUrl?: (url: string) => void;
  onSelectDataUrl?: (dataUrl: string) => void;
  onSelectBlob?: (blob: Blob) => void;
  onSelectText?: (text: string) => void;
  label?: string;
  variant?: "default" | "chips";
  className?: string;
}

export const SampleMediaPicker = ({
  items,
  onSelect,
  onSelectUrl,
  onSelectDataUrl,
  onSelectBlob,
  onSelectText,
  label = "Or try one of these samples:",
  variant = "default",
  className,
}: SampleMediaPickerProps) => {
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);
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
    if (!item.url) return;

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
    const identifier = item.url || item.name;
    setLoadingIdentifier(identifier);

    try {
      if (item.type === "text") {
        let textContent = item.text || "";
        if (!textContent && item.url) {
          const res = await fetch(item.url);
          textContent = await res.text();
        }

        if (onSelect) {
          onSelect({ text: textContent, url: item.url });
        }
        if (onSelectText) {
          onSelectText(textContent);
        }
        if (onSelectUrl && item.url) {
          onSelectUrl(item.url);
        }
        setLoadingIdentifier(null);
        return;
      }

      if (item.url) {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const dataUrl = typeof reader.result === "string" ? reader.result : item.url;

          if (onSelect) {
            onSelect({ url: item.url, blob, dataUrl });
          }
          if (onSelectUrl && item.url) {
            onSelectUrl(item.url);
          }
          if (onSelectDataUrl && dataUrl) {
            onSelectDataUrl(dataUrl);
          }
          if (onSelectBlob) {
            onSelectBlob(blob);
          }
          setLoadingIdentifier(null);
        };

        reader.onerror = () => {
          if (onSelect) {
            onSelect({ url: item.url, blob });
          }
          if (onSelectUrl && item.url) {
            onSelectUrl(item.url);
          }
          if (onSelectBlob) {
            onSelectBlob(blob);
          }
          setLoadingIdentifier(null);
        };

        reader.readAsDataURL(blob);
      }
    } catch {
      if (onSelect) {
        onSelect({ url: item.url, text: item.text });
      }
      if (onSelectUrl && item.url) {
        onSelectUrl(item.url);
      }
      if (onSelectText && item.text) {
        onSelectText(item.text);
      }
      setLoadingIdentifier(null);
    }
  };

  const hasAudioOrVideo = items.some((item) => item.type === "audio" || item.type === "video");

  if (variant === "chips") {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {label && (
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <Small className="text-xs font-medium">{label}</Small>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const identifier = item.url || item.name;
            const isLoading = loadingIdentifier === identifier;

            return (
              <Button
                key={item.name}
                variant="outline"
                size="sm"
                type="button"
                disabled={loadingIdentifier !== null}
                onClick={() => handleSampleClick(item)}
                className="h-7 rounded-full border-dashed text-xs"
              >
                {isLoading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="text-muted-foreground mr-1 h-3 w-3" />
                )}
                {item.name}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && <Muted className="text-xs">{label}</Muted>}
      <div
        className={cn(
          "grid w-full gap-3",
          hasAudioOrVideo ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
        )}
      >
        {items.map((item) => {
          const identifier = item.url || item.name;
          const isLoading = loadingIdentifier === identifier;

          if (item.type === "text") {
            return (
              <div
                key={item.name}
                className="bg-card text-card-foreground flex w-full items-center justify-between gap-4 rounded-xl border p-4 shadow-xs"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Small className="block truncate text-sm font-semibold">{item.name}</Small>
                    {(item.description || item.text) && (
                      <Muted className="block truncate text-xs">
                        {item.description || item.text}
                      </Muted>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={loadingIdentifier !== null}
                  onClick={() => handleSampleClick(item)}
                  aria-label={`Select text sample ${item.name}`}
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

          if (item.type === "image") {
            return (
              <Button
                key={item.name}
                variant="ghost"
                type="button"
                disabled={loadingIdentifier !== null}
                onClick={() => handleSampleClick(item)}
                className="group relative h-auto border p-1"
              >
                <img src={item.url} alt="" className="h-20 w-full rounded object-cover" />
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
                  disabled={loadingIdentifier !== null}
                  onClick={() => handleSampleClick(item)}
                  aria-label={`Select sample ${item.name}`}
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
            <div
              key={item.name}
              className="bg-card text-card-foreground flex w-full items-center justify-between gap-4 rounded-xl border p-4 shadow-xs"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Film className="h-4 w-4" aria-hidden="true" />
                </div>
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
                disabled={loadingIdentifier !== null}
                onClick={() => handleSampleClick(item)}
                aria-label={`Select video sample ${item.name}`}
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
        })}
      </div>
    </div>
  );
};
