import { AudioPlayer } from "@/apps/text-to-music/components/audio-player";

type ExportStepProps = {
  prompt: string;
  duration: number;
  audioBlob: Blob;
  samplingRate: number;
};

export const ExportStep = ({ prompt, duration, audioBlob, samplingRate }: ExportStepProps) => {
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
