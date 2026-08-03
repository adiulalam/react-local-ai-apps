import { ImageClassifierStepper } from "@/apps/image-classifier/components/image-classifier-stepper";
import { ImageClassifierProvider } from "@/apps/image-classifier/context/image-classifier-context";

const ImageClassifierScreen = () => {
  return (
    <ImageClassifierProvider>
      <div className="flex h-full w-full flex-col items-center py-10">
        <ImageClassifierStepper />
      </div>
    </ImageClassifierProvider>
  );
};

export default ImageClassifierScreen;
