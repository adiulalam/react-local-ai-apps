import { defineStepper } from "@stepperize/react";
import { type StepStatus, useStepItemContext } from "@stepperize/react/primitives";
import React, { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageInputStep } from "./steps/step-1";
import { ClassificationStep } from "./steps/step-2";
import { CaptionStep } from "./steps/step-3";
import { H2, Muted, Small } from "@/components/ui/typography";
import type { ClassificationResult } from "../utils/worker-message-handler";

// Define the steps
const { Stepper } = defineStepper(
  { id: "step-1", title: "Image Input", description: "Upload an image" },
  { id: "step-2", title: "Classification", description: "Classify the image" },
  { id: "step-3", title: "Caption Description", description: "Generate caption" }
);

export type ImageClassifierState = {
  imageDataUrl?: string;
  results?: ClassificationResult[];
};

const StepperTriggerWrapper = () => {
  const item = useStepItemContext();
  const isInactive = item.status === "inactive";

  return (
    <Stepper.Trigger
      render={(domProps) => (
        <Button variant={isInactive ? "secondary" : "default"} size="icon" {...domProps}>
          <Stepper.Indicator>{item.index + 1}</Stepper.Indicator>
        </Button>
      )}
    />
  );
};

const StepperSeparator = ({ status, isLast }: { status: StepStatus; isLast: boolean }) => {
  if (isLast) return null;

  return (
    <Stepper.Separator
      orientation="vertical"
      data-status={status}
      className="bg-muted data-[status=success]:bg-primary h-full min-h-8 w-0.5 data-disabled:opacity-50"
    />
  );
};

export const ImageClassifierStepper = () => {
  const [formData, setFormData] = useState<ImageClassifierState>({});

  return (
    <div className="bg-card mx-auto w-full max-w-4xl space-y-8 rounded-xl border p-6 shadow-sm">
      <div className="mb-4">
        <H2>Image Classification</H2>
        <Muted>Classify images completely offline.</Muted>
      </div>

      <Stepper.Root className="w-full space-y-4" orientation="vertical">
        {({ stepper }) => (
          <>
            <Stepper.List className="flex list-none flex-col gap-0">
              {stepper.state.all.map((stepData, index) => {
                const currentIndex = stepper.state.current.index;
                const status =
                  index < currentIndex ? "success" : index === currentIndex ? "active" : "inactive";
                const isLast = index === stepper.state.all.length - 1;

                return (
                  <React.Fragment key={stepData.id}>
                    <Stepper.Item
                      step={stepData.id}
                      className="group peer relative flex shrink-0 items-center gap-4 py-2"
                    >
                      <StepperTriggerWrapper />
                      <div className="flex flex-col items-start gap-1">
                        <Stepper.Title
                          render={(props) => (
                            <Small className="block" {...props}>
                              {stepData.title}
                            </Small>
                          )}
                        />
                        <Stepper.Description
                          render={(props) => (
                            <Muted className="text-xs" {...props}>
                              {stepData.description}
                            </Muted>
                          )}
                        />
                      </div>
                    </Stepper.Item>

                    <div className="flex gap-4">
                      {!isLast && (
                        <div className="flex justify-center self-stretch ps-[calc(var(--spacing)*4.5-1px)]">
                          <StepperSeparator status={status} isLast={isLast} />
                        </div>
                      )}

                      {stepData.id === stepper.state.current.data.id && (
                        <div className="border-border/50 bg-secondary/20 my-4 flex-1 rounded-lg border p-6 ps-4 shadow-sm">
                          {stepper.flow.switch({
                            "step-1": () => (
                              <ImageInputStep
                                onNext={(imageDataUrl) => {
                                  setFormData((prev) => ({ ...prev, imageDataUrl }));
                                  stepper.navigation.next();
                                }}
                              />
                            ),
                            "step-2": () => (
                              <ClassificationStep
                                imageDataUrl={formData.imageDataUrl!}
                                onNext={(results) => {
                                  setFormData((prev) => ({ ...prev, results }));
                                  stepper.navigation.next();
                                }}
                              />
                            ),
                            "step-3": () => (
                              <CaptionStep imageDataUrl={formData.imageDataUrl!} />
                            ),
                          })}
                        </div>
                      )}

                      {stepData.id !== stepper.state.current.data.id && !isLast && (
                        <div className="my-4 flex-1 ps-4"></div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </Stepper.List>

            <div className="mt-6 flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={() => stepper.navigation.prev()}
                disabled={stepper.state.isFirst}
              >
                <ArrowLeft />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({});
                  stepper.navigation.reset();
                }}
              >
                <RotateCcw />
                Start Over
              </Button>
            </div>
          </>
        )}
      </Stepper.Root>
    </div>
  );
};
