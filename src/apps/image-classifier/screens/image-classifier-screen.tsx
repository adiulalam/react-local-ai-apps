import { ImageClassifierStepper } from "@/apps/image-classifier/components/image-classifier-stepper";

const ImageClassifierScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <ImageClassifierStepper />
    </div>
  );
};

export default ImageClassifierScreen;
