import { BackgroundRemoverStepper } from "@/apps/background-remover/components/background-remover-stepper";

const BackgroundRemoverScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <BackgroundRemoverStepper />
    </div>
  );
};

export default BackgroundRemoverScreen;
