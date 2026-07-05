import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FileUploadInputProps {
  onBlobReady: (blob: Blob) => void;
  disabled?: boolean;
}

export const FileUploadInput = ({ onBlobReady, disabled }: FileUploadInputProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onBlobReady(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="audio-file">Upload Audio</Label>
      <Input
        id="audio-file"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="cursor-pointer"
      />
    </div>
  );
};
