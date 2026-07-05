import { defineStepper } from "@stepperize/react";
import { type StepStatus, useStepItemContext } from "@stepperize/react/primitives";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { AudioInputStep } from "./steps/step-1";
import { TranscriptionStep } from "./steps/step-2";
import { SummarizationStep } from "./steps/step-3";
import { ExportStep } from "./steps/step-4";

// Define the steps
const { Stepper } = defineStepper(
  { id: "step-1", title: "Audio Input", description: "Upload or record audio" },
  { id: "step-2", title: "Transcription", description: "Extract text from audio" },
  { id: "step-3", title: "Summarization", description: "Summarize extracted text" },
  { id: "step-4", title: "Export", description: "Review and export summary" }
);

export type ScribeState = {
  audioData?: Float32Array;
  transcription?: string;
  summary?: string;
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

export function ScribeStepper() {
  const [formData, setFormData] = useState<ScribeState>({});

  return (
    <div className="bg-card mx-auto w-full max-w-4xl space-y-8 rounded-xl border p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Local Scribe</h2>
        <p className="text-muted-foreground text-sm">
          Transcribe and summarize audio completely offline.
        </p>
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
                            <h4 className="text-sm font-medium" {...props}>
                              {stepData.title}
                            </h4>
                          )}
                        />
                        <Stepper.Description
                          render={(props) => (
                            <p className="text-muted-foreground text-xs" {...props}>
                              {stepData.description}
                            </p>
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
                              <AudioInputStep
                                onNext={(audioData) => {
                                  setFormData((prev) => ({ ...prev, audioData }));
                                  stepper.navigation.next();
                                }}
                              />
                            ),
                            "step-2": () => (
                              <TranscriptionStep
                                audioData={formData.audioData!}
                                onNext={(transcription) => {
                                  setFormData((prev) => ({ ...prev, transcription }));
                                  stepper.navigation.next();
                                }}
                              />
                            ),
                            "step-3": () => (
                              <SummarizationStep
                                transcription={formData.transcription!}
                                onNext={(summary) => {
                                  setFormData((prev) => ({ ...prev, summary }));
                                  stepper.navigation.next();
                                }}
                              />
                            ),
                            "step-4": () => (
                              <ExportStep
                                transcription={formData.transcription}
                                summary={formData.summary}
                              />
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
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({});
                  stepper.navigation.reset();
                }}
              >
                Start Over
              </Button>
            </div>
          </>
        )}
      </Stepper.Root>
    </div>
  );
}
