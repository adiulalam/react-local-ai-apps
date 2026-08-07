import { ImageClassifierStepper } from "@/apps/image-classifier/components/image-classifier-stepper";
import { ImageClassifierFormProvider } from "@/apps/image-classifier/context/image-classifier-context";
import { ImageClassificationProvider } from "@/apps/image-classifier/context/image-classification-context";
import { ImageCaptioningProvider } from "@/apps/image-classifier/context/image-captioning-context";

const ImageClassifierScreen = () => {
  return (
    <ImageClassifierFormProvider>
      <ImageClassificationProvider>
        <ImageCaptioningProvider>
          <div className="flex h-full w-full flex-col items-center py-10">
            <ImageClassifierStepper />
          </div>
        </ImageCaptioningProvider>
      </ImageClassificationProvider>
    </ImageClassifierFormProvider>
  );
};

export default ImageClassifierScreen;
