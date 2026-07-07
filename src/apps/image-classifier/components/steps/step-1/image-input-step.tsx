import { useState, useRef } from "react";
import { ArrowRight, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import {
  FileUploadRoot,
  FileUploadIcon,
  FileUploadText,
  FileUploadInput
} from "@/components/ui/file-upload";

interface ImageInputStepProps {
  onNext: (imageDataUrl: string) => void;
}

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

      {image && (
        <div className="flex flex-col items-center space-y-4">
          <img src={image} alt="Preview" className="max-h-64 rounded-lg object-contain" />
          <div className="flex w-full justify-end">
            <Button onClick={() => onNext(image)}>
              Classification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
