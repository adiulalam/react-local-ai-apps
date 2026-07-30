import type { AllTasks, PipelineType } from "@huggingface/transformers";

export const getMockPipeline = async <T extends PipelineType>(
  task: T,
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks[T]> => {
  // Simulate the loading events for the UI
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  if (task === "image-classification") {
    return (async () => {
      return [
        { label: "mock golden retriever", score: 0.85 },
        { label: "mock labrador", score: 0.1 },
        { label: "mock beagle", score: 0.05 },
      ];
    }) as unknown as AllTasks[T];
  }

  if (task === "image-to-text") {
    return (async () => {
      return [{ generated_text: "a mock caption of a cute animal" }];
    }) as unknown as AllTasks[T];
  }

  throw new Error(`Mock pipeline not implemented for task: ${task}`);
};
