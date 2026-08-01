import { VoiceCloningStepper } from "@/apps/voice-cloning/components/voice-cloning-stepper";

const VoiceCloningScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <VoiceCloningStepper />
    </div>
  );
};

export default VoiceCloningScreen;
