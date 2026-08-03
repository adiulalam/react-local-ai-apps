import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AudioInputStep } from "./steps/step-1";
import { TranscriptionStep } from "./steps/step-2";
import { SummarizationStep } from "./steps/step-3";
import { ExportStep } from "./steps/step-4";
import { H1, Muted, Small } from "@/components/ui/typography";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { useScribeContext } from "../context/scribe-context";

const steps = [
  { id: "step-1", step: 1, title: "Audio Input", description: "Upload or record audio" },
  { id: "step-2", step: 2, title: "Transcription", description: "Extract text from audio" },
  { id: "step-3", step: 3, title: "Summarization", description: "Summarize extracted text" },
  { id: "step-4", step: 4, title: "Export", description: "Review and export summary" },
];

export const ScribeStepper = () => {
  const { activeStep, setActiveStep, prevStep, reset } = useScribeContext();

  return (
    <div className="bg-card mx-auto w-full max-w-4xl space-y-8 rounded-xl border p-6 shadow-sm">
      <div className="mb-4">
        <H1>Local Scribe</H1>
        <Muted>Transcribe and summarize audio completely offline.</Muted>
      </div>

      <Stepper
        value={activeStep}
        onValueChange={setActiveStep}
        orientation="vertical"
        className="w-full space-y-4"
      >
        <StepperNav className="w-full flex-col gap-0">
          {steps.map((stepData, index) => {
            const isLast = index === steps.length - 1;

            return (
              <StepperItem
                key={stepData.id}
                step={stepData.step}
                className="flex-col items-stretch justify-start not-last:flex-1"
              >
                <div className="group peer relative flex shrink-0 items-center gap-4 py-2">
                  <StepperTrigger
                    render={
                      <Button
                        variant={activeStep >= stepData.step ? "default" : "secondary"}
                        size="icon"
                        className="shrink-0 rounded-full"
                        aria-label={`Step ${stepData.step}: ${stepData.title}`}
                      />
                    }
                  >
                    <StepperIndicator>{stepData.step}</StepperIndicator>
                  </StepperTrigger>
                  <div className="flex flex-col items-start gap-1">
                    <StepperTitle className="text-sm leading-none font-medium">
                      <Small className="block">{stepData.title}</Small>
                    </StepperTitle>
                    <StepperDescription className="text-muted-foreground text-xs">
                      <Muted className="text-xs">{stepData.description}</Muted>
                    </StepperDescription>
                  </div>
                </div>

                <div className="flex gap-4">
                  {!isLast && (
                    <div className="flex justify-center self-stretch ps-[calc(var(--spacing)*4.5-5px)]">
                      <StepperSeparator className="bg-muted data-[state=completed]:bg-primary h-full min-h-8 w-0.5 group-data-[orientation=vertical]/stepper-nav:h-full group-data-[orientation=vertical]/stepper-nav:w-0.5 data-disabled:opacity-50" />
                    </div>
                  )}

                  <StepperContent
                    value={stepData.step}
                    className="border-border/50 bg-secondary/20 my-4 block w-full flex-1 rounded-lg border p-6 ps-4 shadow-sm"
                  >
                    {stepData.id === "step-1" && <AudioInputStep />}
                    {stepData.id === "step-2" && <TranscriptionStep />}
                    {stepData.id === "step-3" && <SummarizationStep />}
                    {stepData.id === "step-4" && <ExportStep />}
                  </StepperContent>

                  {activeStep !== stepData.step && !isLast && (
                    <div className="my-4 flex-1 ps-4"></div>
                  )}
                </div>
              </StepperItem>
            );
          })}
        </StepperNav>

        <div className="mt-6 flex justify-between border-t pt-6">
          <Button variant="outline" onClick={prevStep} disabled={activeStep === 1}>
            <ArrowLeft />
            Back
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw />
            Start Over
          </Button>
        </div>
      </Stepper>
    </div>
  );
};
