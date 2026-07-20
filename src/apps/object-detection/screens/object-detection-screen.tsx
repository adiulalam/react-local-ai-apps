import { ObjectDetectionStepper } from "@/apps/object-detection/components/object-detection-stepper";

const ObjectDetectionScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <ObjectDetectionStepper />
    </div>
  );
};

export default ObjectDetectionScreen;
