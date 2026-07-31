import { useState, useRef } from "react";
import { ArrowRight, Video as VideoIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import {
  FileUploadRoot,
  FileUploadIcon,
  FileUploadText,
  FileUploadInput,
} from "@/components/ui/file-upload";
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";

interface InputStepProps {
  onNext: (data: { videoUrl?: string; videoBlob?: Blob }) => void;
}

const VIDEO_CAPTIONING_SAMPLES: SampleMediaItem[] = [
  {
    name: "Video Speech",
    url: "/sample/video-speech.mkv",
    type: "video",
    description: "Sample video with speech",
  },
];

export const InputStep = ({ onNext }: InputStepProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoBlob(file);
  };

  const handleSampleBlobSelect = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    setVideoBlob(blob);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <FileUploadRoot>
            <FileUploadIcon>
              <UploadCloud className="text-primary h-8 w-8" />
            </FileUploadIcon>
            <FileUploadText>
              <Small className="block">Upload a video</Small>
              <Muted>Click to browse for a video file</Muted>
            </FileUploadText>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <VideoIcon className="mr-2 h-4 w-4" />
              Select Video
            </Button>
            <FileUploadInput
              ref={fileInputRef}
              accept="video/*"
              onFileSelect={handleFileSelect}
              data-testid="video-file-input"
            />
          </FileUploadRoot>
        </div>
      </div>

      <SampleMediaPicker
        items={VIDEO_CAPTIONING_SAMPLES}
        onSelectBlob={handleSampleBlobSelect}
        label="Or try this sample video:"
      />

      {videoUrl && (
        <div className="flex flex-col items-center space-y-4">
          <video src={videoUrl} controls className="max-h-64 rounded-lg border object-contain" />
          <div className="flex w-full justify-end">
            <Button
              onClick={() => {
                if (videoBlob && videoUrl) {
                  onNext({ videoUrl, videoBlob });
                }
              }}
            >
              Start Captioning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
