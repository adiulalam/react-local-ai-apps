import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export interface SampleImage {
  name: string;
  url: string;
}

interface SampleImagePickerProps {
  images: SampleImage[];
  onSelect: (imageDataUrl: string) => void;
  label?: string;
  className?: string;
}

export const SampleImagePicker = ({
  images,
  onSelect,
  label = "Or try one of these sample images:",
  className,
}: SampleImagePickerProps) => {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  const handleSampleClick = async (url: string) => {
    setLoadingUrl(url);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onSelect(reader.result);
        } else {
          onSelect(url);
        }
        setLoadingUrl(null);
      };
      reader.onerror = () => {
        onSelect(url);
        setLoadingUrl(null);
      };
      reader.readAsDataURL(blob);
    } catch {
      onSelect(url);
      setLoadingUrl(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Muted className="text-xs">{label}</Muted>
      <div className="grid grid-cols-3 gap-3">
        {images.map((sample) => (
          <Button
            key={sample.name}
            variant="ghost"
            type="button"
            disabled={loadingUrl !== null}
            onClick={() => handleSampleClick(sample.url)}
            className="group relative h-auto border p-1"
          >
            <img src={sample.url} alt={sample.name} className="h-20 w-full rounded object-cover" />
            <Small className="bg-background/80 absolute right-1 bottom-1 left-1 truncate rounded px-1.5 py-0.5 text-center text-[10px] backdrop-blur-sm">
              {loadingUrl === sample.url ? "Loading..." : sample.name}
            </Small>
          </Button>
        ))}
      </div>
    </div>
  );
};
