import { AudioPlayer } from "@/apps/text-to-music/components/audio-player";
import { useTextToMusic } from "@/apps/text-to-music/context/text-to-music-context";

export const ExportStep = () => {
  const { formData } = useTextToMusic();
  const { params, audioBlob, samplingRate } = formData;
  if (!params || !audioBlob || !samplingRate) return null;
  const { prompt, duration } = params;
  return (
    <div className="space-y-6">
      <AudioPlayer
        audioBlob={audioBlob}
        prompt={prompt}
        duration={duration}
        samplingRate={samplingRate}
      />
    </div>
  );
};
