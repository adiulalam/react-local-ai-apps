import { useRef, useState } from "react";
import { type CaptionChunk } from "@/apps/video-captioning/utils/worker-message-handler";

interface ResultStepProps {
  videoUrl?: string;
  chunks: CaptionChunk[];
}

export const ResultStep = ({ videoUrl, chunks }: ResultStepProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentCaption, setCurrentCaption] = useState<string>("");

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;

    const activeChunk = chunks.find(
      (chunk) => chunk.timestamp && time >= chunk.timestamp[0] && time <= chunk.timestamp[1]
    );

    if (activeChunk) {
      setCurrentCaption(activeChunk.text);
    } else {
      setCurrentCaption("");
    }
  };

  if (!videoUrl) return null;

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col items-center overflow-hidden rounded-lg border bg-black">
        <video
          data-testid="result-video"
          ref={videoRef}
          src={videoUrl}
          controls
          className="max-h-150 w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
        />
        {currentCaption && (
          <div className="pointer-events-none absolute right-0 bottom-16 left-0 px-4 text-center">
            <span
              data-testid="caption-text"
              className="inline-block rounded bg-black/75 px-3 py-1 text-lg font-medium text-white"
            >
              {currentCaption}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
