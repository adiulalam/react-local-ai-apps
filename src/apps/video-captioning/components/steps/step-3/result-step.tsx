import { useRef, useState } from "react";
import { Large } from "@/components/ui/typography";
import { type CaptionChunk } from "@/apps/video-captioning/utils/worker-message-handler";
import { useVideoCaptioningContext } from "@/apps/video-captioning/context/video-captioning-context";

export const ResultStep = () => {
  const { formData } = useVideoCaptioningContext();
  const { videoUrl, chunks = [] } = formData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentCaption, setCurrentCaption] = useState<string>("");

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;

    const activeChunk = chunks.find(
      (chunk: CaptionChunk) =>
        chunk.timestamp && time >= chunk.timestamp[0] && time <= chunk.timestamp[1]
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
            <Large
              data-testid="caption-text"
              className="inline-block rounded bg-black/75 px-3 py-1 text-white"
            >
              {currentCaption}
            </Large>
          </div>
        )}
      </div>
    </div>
  );
};
