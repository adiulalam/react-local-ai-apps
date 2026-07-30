import { Tensor, type AllTasks, type PipelineType, type PreTrainedModel, type Processor } from "@huggingface/transformers";

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

export const getMockBackgroundRemover = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<[PreTrainedModel, Processor]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  const mockModel = async () => {
    return {
      output: [
        {
          mul: () => ({
            to: () => new Tensor("uint8", new Uint8Array(100 * 100), [1, 100, 100]),
          }),
        },
      ],
    };
  };

  const mockProcessor = async () => {
    return { pixel_values: [] };
  };

  return [mockModel as unknown as PreTrainedModel, mockProcessor as unknown as Processor];
};
