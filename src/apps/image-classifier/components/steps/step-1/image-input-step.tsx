import { useState, useRef } from "react";
import { ArrowRight, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";

interface ImageInputStepProps {
  onNext: (imageDataUrl: string) => void;
}

export const ImageInputStep = ({ onNext }: ImageInputStepProps) => {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-8">
        <div className="bg-primary/10 rounded-full p-4">
          <UploadCloud className="text-primary h-8 w-8" />
        </div>
        <div className="text-center">
          <Small className="block">Upload an image</Small>
          <Muted>Click to browse for an image file</Muted>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <ImageIcon className="mr-2 h-4 w-4" />
          Select Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {image && (
        <div className="flex flex-col items-center space-y-4">
          <img src={image} alt="Preview" className="max-h-64 rounded-lg object-contain" />
          <div className="flex w-full justify-end">
            <Button onClick={() => onNext(image)}>
              Continue to Classification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
