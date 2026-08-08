import { TextToMusicStepper } from "@/apps/text-to-music/components/text-to-music-stepper";
import { TextToMusicProvider } from "@/apps/text-to-music/context/text-to-music-context";

const TextToMusicScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <TextToMusicProvider>
        <TextToMusicStepper />
      </TextToMusicProvider>
    </div>
  );
};

export default TextToMusicScreen;
