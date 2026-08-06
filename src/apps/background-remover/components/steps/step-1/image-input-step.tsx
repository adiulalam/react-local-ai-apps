import { useState, useRef } from "react";
import { ArrowRight, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackgroundRemover } from "@/apps/background-remover/context/background-remover-context";
import { Muted, Small } from "@/components/ui/typography";
import {
  FileUploadRoot,
  FileUploadIcon,
  FileUploadText,
  FileUploadInput,
} from "@/components/ui/file-upload";
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";

const BG_REMOVER_SAMPLE_IMAGES: SampleMediaItem[] = [
  {
    name: "Portrait",
    url: "/sample/portrait.jpg",
    type: "image",
  },
  {
    name: "Sneakers",
    url: "/sample/shoes.jpg",
    type: "image",
  },
  {
    name: "Dog",
    url: "/sample/dog.jpg",
    type: "image",
  },
];

export const ImageInputStep = () => {
  const { setFormData, nextStep } = useBackgroundRemover();
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <FileUploadRoot>
        <FileUploadIcon>
          <UploadCloud className="text-primary h-8 w-8" />
        </FileUploadIcon>
        <FileUploadText>
          <Small className="block">Upload an image</Small>
          <Muted>Click to browse for an image file</Muted>
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

      <SampleMediaPicker
        items={BG_REMOVER_SAMPLE_IMAGES}
        onSelectDataUrl={setImage}
        label="Or try one of these sample images:"
      />

      {image && (
        <div className="flex flex-col items-center space-y-4">
          <img src={image} alt="Preview" className="max-h-64 rounded-lg object-contain" />
          <div className="flex w-full justify-end">
            <Button
              onClick={() => {
                setFormData((prev) => ({ ...prev, imageDataUrl: image }));
                nextStep();
              }}
            >
              Remove Background
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
