import { ScribeStepper } from "@/apps/scribe/components/scribe-stepper";
import { ScribeFormProvider } from "@/apps/scribe/context/scribe-context";
import { WhisperProvider } from "@/apps/scribe/context/whisper-context";
import { SummaryProvider } from "@/apps/scribe/context/summary-context";

const ScribeScreen = () => {
  return (
    <div className="flex h-full w-full flex-col items-center py-10">
      <ScribeFormProvider>
        <WhisperProvider>
          <SummaryProvider>
            <ScribeStepper />
          </SummaryProvider>
        </WhisperProvider>
      </ScribeFormProvider>
    </div>
  );
};

export default ScribeScreen;
