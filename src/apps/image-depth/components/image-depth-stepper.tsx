import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageInputStep } from "./steps/step-1/image-input-step";
import { DepthStep } from "./steps/step-2/depth-step";
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

export type ImageDepthState = {
  imageDataUrl?: string;
};

const steps = [
  { id: "step-1", step: 1, title: "Image Input", description: "Upload an image" },
  { id: "step-2", step: 2, title: "Depth Estimation", description: "Generate 3D depth map" },
];

export const ImageDepthStepper = () => {
  const [formData, setFormData] = useState<ImageDepthState>({});
  const [activeStep, setActiveStep] = useState(1);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setFormData({});
    setActiveStep(1);
  };

  return (
    <div className="bg-card mx-auto w-full max-w-4xl space-y-8 rounded-xl border p-6 shadow-sm">
      <div className="mb-4">
        <H1>Image Depth Estimation</H1>
        <Muted>Estimate 3D depth maps from images locally using WebGPU and Depth Anything.</Muted>
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
                    {stepData.id === "step-1" && (
                      <ImageInputStep
                        onNext={(imageDataUrl) => {
                          setFormData((prev) => ({ ...prev, imageDataUrl }));
                          nextStep();
                        }}
                      />
                    )}
                    {stepData.id === "step-2" && (
                      <DepthStep imageDataUrl={formData.imageDataUrl!} />
                    )}
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </Stepper>
    </div>
  );
};
