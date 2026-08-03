import { AudioPlayer } from "@/apps/voice-cloning/components/audio-player";
import { P } from "@/components/ui/typography";
import { useVoiceCloning } from "@/apps/voice-cloning/context/voice-cloning-context";

export const ExportStep = () => {
  const { state } = useVoiceCloning();
  const { params, audioBlob, samplingRate } = state;

  if (!audioBlob) return null;
  return (
    <div className="space-y-6">
      <P className="text-sm">
        Your voice cloning audio has been generated successfully! You can play it below or download
        the audio file.
      </P>

      <AudioPlayer
        audioBlob={audioBlob}
        prompt={params?.text || ""}
        samplingRate={samplingRate || 24000}
      />
    </div>
  );
};
