import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";
import { useRAGLLMContext } from "@/apps/semantic-search/context/rag-llm-context";
import { DocumentInputStep } from "./steps/step-1";
import { VectorIndexingStep } from "./steps/step-2";
import { SemanticSearchStep } from "./steps/step-3";
import { LocalRAGChatStep } from "./steps/step-4";

const steps = [
  {
    id: "step-1",
    step: 1,
    title: "Document Input",
    description: "Upload, paste text, or pick sample document",
  },
  {
    id: "step-2",
    step: 2,
    title: "Vector Indexing",
    description: "Embed document chunks with Transformers.js",
  },
  {
    id: "step-3",
    step: 3,
    title: "Semantic Search",
    description: "Find and highlight relevant passages instantly",
  },
  {
    id: "step-4",
    step: 4,
    title: "Local RAG Chat",
    description: "Chat with verified context and citations",
  },
];

export const SemanticSearchStepper = () => {
  const { activeStep, setActiveStep, prevStep, reset } = useSemanticSearchContext();
  const { resetWorker: resetEmbedding } = useEmbeddingContext();
  const { resetWorker: resetRAG } = useRAGLLMContext();

  const handleReset = () => {
    reset();
    resetEmbedding();
    resetRAG();
  };

  return (
    <div className="bg-card mx-auto w-full max-w-5xl space-y-8 rounded-xl border p-6 shadow-xs">
      <div className="mb-4">
        <H1>Local Semantic Search (RAG)</H1>
        <Muted>
          Search, highlight, and chat with your documents completely offline in your browser.
        </Muted>
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
                    className="border-border/50 bg-secondary/20 my-4 block w-full flex-1 rounded-lg border p-6 ps-4 shadow-xs"
                  >
                    {stepData.id === "step-1" && <DocumentInputStep />}
                    {stepData.id === "step-2" && <VectorIndexingStep />}
                    {stepData.id === "step-3" && <SemanticSearchStep />}
                    {stepData.id === "step-4" && <LocalRAGChatStep />}
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
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-1.5 size-4" />
            Start Over
          </Button>
        </div>
      </Stepper>
    </div>
  );
};
