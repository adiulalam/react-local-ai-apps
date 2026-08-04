import { TextToMusicStepper } from "../components/text-to-music-stepper";
import { TextToMusicProvider } from "../context/text-to-music-context";

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
