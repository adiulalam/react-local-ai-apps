import { BackgroundRemoverStepper } from "@/apps/background-remover/components/background-remover-stepper";
import { BackgroundRemoverProvider } from "@/apps/background-remover/context/background-remover-context";

const BackgroundRemoverScreen = () => {
  return (
    <BackgroundRemoverProvider>
      <div className="flex h-full w-full flex-col items-center py-10">
        <BackgroundRemoverStepper />
      </div>
    </BackgroundRemoverProvider>
  );
};

export default BackgroundRemoverScreen;
