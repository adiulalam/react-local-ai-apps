import { ImageDepthStepper } from "@/apps/image-depth/components/image-depth-stepper";
import { ImageDepthProvider } from "@/apps/image-depth/context/image-depth-context";

const ImageDepthScreen = () => {
  return (
    <ImageDepthProvider>
      <div className="container mx-auto p-4 md:p-8">
        <ImageDepthStepper />
      </div>
    </ImageDepthProvider>
  );
};

export default ImageDepthScreen;
