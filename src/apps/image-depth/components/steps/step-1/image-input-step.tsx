import { useState, useRef } from "react";
import { ArrowRight, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import {
  FileUploadRoot,
  FileUploadIcon,
  FileUploadText,
  FileUploadInput,
} from "@/components/ui/file-upload";

interface ImageInputStepProps {
  onNext: (imageDataUrl: string) => void;
}

const SAMPLE_IMAGES = [
  {
    name: "Room Interior",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Street View",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Nature Landscape",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  },
];

export const ImageInputStep = ({ onNext }: ImageInputStepProps) => {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      setImage(url);
    }
  };

  return (
    <div className="space-y-6">
      <FileUploadRoot>
        <FileUploadIcon>
          <UploadCloud className="text-primary h-8 w-8" />
        </FileUploadIcon>
        <FileUploadText>
          <Small className="block">Upload an image</Small>
          <Muted>Click or drop an image to estimate 3D depth</Muted>
        </FileUploadText>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <ImageIcon className="mr-2 h-4 w-4" />
          Select Image
        </Button>
        <FileUploadInput
          ref={fileInputRef}
          accept="image/*"
          onFileSelect={handleFileSelect}
          data-testid="image-file-input"
        />
      </FileUploadRoot>

      <div>
        <Muted className="mb-2 text-xs">Or try one of these sample images:</Muted>
        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => handleSampleSelect(sample.url)}
              className="border-border hover:border-primary group relative overflow-hidden rounded-lg border p-1 transition-all"
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="h-20 w-full rounded object-cover transition-transform group-hover:scale-105"
              />
              <span className="bg-background/80 absolute right-1 bottom-1 left-1 truncate rounded px-1.5 py-0.5 text-center text-[10px] font-medium backdrop-blur-sm">
                {sample.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {image && (
        <div className="flex flex-col items-center space-y-4 pt-2">
          <div className="bg-muted/40 relative flex max-h-72 w-full items-center justify-center overflow-hidden rounded-lg border p-2">
            <img src={image} alt="Preview" className="max-h-64 rounded-md object-contain" />
          </div>
          <div className="flex w-full justify-end">
            <Button onClick={() => onNext(image)}>
              Estimate Depth
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
