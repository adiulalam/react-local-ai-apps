import { useState, useRef } from "react";
import { ArrowRight, Video as VideoIcon, UploadCloud, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import {
  FileUploadRoot,
  FileUploadIcon,
  FileUploadText,
  FileUploadInput,
} from "@/components/ui/file-upload";
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";
import { useObjectDetectionContext } from "@/apps/object-detection/context/object-detection-context";

const OBJECT_DETECTION_SAMPLES: SampleMediaItem[] = [
  {
    name: "People Walking",
    url: "/sample/people-walking.mp4",
    type: "video",
    description: "Pedestrian street video",
  },
];

export const InputStep = () => {
  const { setFormData, nextStep } = useObjectDetectionContext();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleNext = (data: { videoUrl?: string; useWebcam?: boolean }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    nextStep();
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

        <div className="bg-card flex flex-1 flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-6">
          <Camera className="text-primary h-8 w-8" />
          <div className="text-center">
            <Small className="block">Use Webcam</Small>
            <Muted>Real-time detection using your camera</Muted>
          </div>
          <Button onClick={() => handleNext({ useWebcam: true })} variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        </div>
      </div>

      <SampleMediaPicker
        items={OBJECT_DETECTION_SAMPLES}
        onSelectUrl={setVideoUrl}
        label="Or try this sample video:"
      />

      {videoUrl && (
        <div className="flex flex-col items-center space-y-4">
          <video src={videoUrl} controls className="max-h-64 rounded-lg border object-contain" />
          <div className="flex w-full justify-end">
            <Button onClick={() => handleNext({ videoUrl })}>
              Start Detection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
