import { AudioPlayer } from "@/apps/voice-cloning/components/audio-player";
import { P } from "@/components/ui/typography";

type ExportStepProps = {
  prompt: string;
  audioBlob: Blob;
  samplingRate: number;
};

export const ExportStep = ({ prompt, audioBlob, samplingRate }: ExportStepProps) => {
  return (
    <div className="space-y-6">
      <P className="text-sm">
        Your voice cloning audio has been generated successfully! You can play it below or download
        the audio file.
      </P>

      <AudioPlayer audioBlob={audioBlob} prompt={prompt} samplingRate={samplingRate} />
    </div>
  );
};
