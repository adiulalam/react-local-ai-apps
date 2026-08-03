import { VideoCaptioningStepper } from "@/apps/video-captioning/components/video-captioning-stepper";
import { VideoCaptioningProvider } from "@/apps/video-captioning/context/video-captioning-context";

export default function VideoCaptioningScreen() {
  return (
    <VideoCaptioningProvider>
      <div className="container mx-auto py-8">
        <VideoCaptioningStepper />
      </div>
    </VideoCaptioningProvider>
  );
}
