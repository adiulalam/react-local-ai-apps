import {
  Tensor,
  type AllTasks,
  type PipelineType,
  type PreTrainedModel,
  type Processor,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";

export interface MockStreamer {
  token_callback_function?: (tokens: bigint[]) => void;
  put?: (tokens: bigint[]) => void;
  end?: () => void;
}

const getSharedMockTokenizer = () => {
  return Object.assign(() => ({ input_ids: [1] }), {
    apply_chat_template: () => ({ input_ids: [1, 2, 3] }),
    encode: () => [1, 2],
    decode: () => " mock ",
    batch_decode: () => ["This is a mock response."],
    all_special_ids: [1, 2],
  });
};

const simulateStream = async (streamer?: MockStreamer) => {
  const mockTokens = [10, 11, 12, 13];
  if (streamer) {
    for (let i = 0; i < mockTokens.length; i++) {
      if (typeof streamer.token_callback_function === "function") {
        streamer.token_callback_function([BigInt(mockTokens[i])]);
      }
      if (typeof streamer.put === "function") {
        streamer.put([BigInt(mockTokens[i])]);
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    if (typeof streamer.end === "function") {
      streamer.end();
    }
  }
};

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

  if (task === "depth-estimation") {
    return (async () => {
      return {
        depth: {
          width: 10,
          height: 10,
          channels: 1,
          data: new Uint8Array(100),
        },
      };
    }) as unknown as AllTasks[T];
  }

  if (task === "object-detection") {
    return (async () => {
      return [
        { score: 0.99, label: "person", box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 } },
      ];
    }) as unknown as AllTasks[T];
  }

  if (task === "automatic-speech-recognition") {
    const mockTranscriber = async (_audio: unknown, options: unknown) => {
      const { streamer } = options as { streamer?: MockStreamer };
      await simulateStream(streamer);
      return { text: "mock transcribed text" };
    };
    mockTranscriber.tokenizer = getSharedMockTokenizer();
    return mockTranscriber as unknown as AllTasks[T];
  }

  if (task === "summarization") {
    const mockSummarizer = async (_text: unknown, options: unknown) => {
      const { streamer } = options as { streamer?: MockStreamer };
      await simulateStream(streamer);
      return [{ summary_text: "mock summary text" }];
    };
    mockSummarizer.tokenizer = getSharedMockTokenizer();
    return mockSummarizer as unknown as AllTasks[T];
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

export const getMockLLM = async (
  model: string,
  progress_callback?: (info: unknown) => void
): Promise<[PreTrainedTokenizer, PreTrainedModel]> => {
  if (progress_callback) {
    progress_callback({ status: "initiate", name: model, file: "mock" });
    progress_callback({ status: "ready", name: model, file: "mock" });
  }

  const mockTokenizer = getSharedMockTokenizer();

  const mockModel = {
    generate: async (options: unknown) => {
      const { streamer } = options as { streamer?: MockStreamer };
      await simulateStream(streamer);
      return {
        sequences: [[10, 11, 12, 13]],
      };
    },
  };

  return [mockTokenizer as unknown as PreTrainedTokenizer, mockModel as unknown as PreTrainedModel];
};
