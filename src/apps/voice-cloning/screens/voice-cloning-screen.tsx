import { VoiceCloningStepper } from "@/apps/voice-cloning/components/voice-cloning-stepper";
import { VoiceCloningProvider } from "@/apps/voice-cloning/context/voice-cloning-context";

const VoiceCloningScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <VoiceCloningProvider>
        <VoiceCloningStepper />
      </VoiceCloningProvider>
    </div>
  );
};

export default VoiceCloningScreen;
