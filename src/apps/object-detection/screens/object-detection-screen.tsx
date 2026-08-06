import { ObjectDetectionStepper } from "@/apps/object-detection/components/object-detection-stepper";
import { ObjectDetectionProvider } from "@/apps/object-detection/context/object-detection-context";

const ObjectDetectionScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <ObjectDetectionProvider>
        <ObjectDetectionStepper />
      </ObjectDetectionProvider>
    </div>
  );
};

export default ObjectDetectionScreen;
