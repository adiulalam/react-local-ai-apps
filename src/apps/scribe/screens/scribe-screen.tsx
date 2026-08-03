import { ScribeStepper } from "@/apps/scribe/components/scribe-stepper";
import { ScribeProvider } from "@/apps/scribe/context/scribe-context";

const ScribeScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <ScribeProvider>
        <ScribeStepper />
      </ScribeProvider>
    </div>
  );
};

export default ScribeScreen;
