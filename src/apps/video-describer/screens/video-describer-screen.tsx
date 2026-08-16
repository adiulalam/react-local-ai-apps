import { VideoDescriberStepper } from "@/apps/video-describer/components/video-describer-stepper";
import { VideoDescriberProvider } from "@/apps/video-describer/context/video-describer-context";

const VideoDescriberScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <VideoDescriberProvider>
        <VideoDescriberStepper />
      </VideoDescriberProvider>
    </div>
  );
};

export default VideoDescriberScreen;
