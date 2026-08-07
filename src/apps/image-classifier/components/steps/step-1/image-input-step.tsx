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
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";
import { useImageClassifierFormContext } from "@/apps/image-classifier/context/image-classifier-context";
import { useImageClassificationContext } from "@/apps/image-classifier/context/image-classification-context";

const CLASSIFICATION_SAMPLE_IMAGES: SampleMediaItem[] = [
  {
    name: "Cute Cat",
    url: "/sample/cat.jpg",
    type: "image",
  },
  {
    name: "Sports Car",
    url: "/sample/car.jpg",
    type: "image",
  },
  {
    name: "Burger",
    url: "/sample/food.jpg",
    type: "image",
  },
];

export const ImageInputStep = () => {
  const { nextStep } = useImageClassifierFormContext();
  const { classifyImage } = useImageClassificationContext();
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
        items={CLASSIFICATION_SAMPLE_IMAGES}
        onSelectDataUrl={setImage}
        label="Or try one of these sample images:"
      />

      {image && (
        <div className="flex flex-col items-center space-y-4">
          <img src={image} alt="Preview" className="max-h-64 rounded-lg object-contain" />
          <div className="flex w-full justify-end">
            <Button
              onClick={() => {
                classifyImage(image);
                nextStep();
              }}
            >
              Classify image
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
