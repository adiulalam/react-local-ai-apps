import {
  Tensor,
  type AllTasks,
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

export const getMockImageClassification = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["image-classification"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  return (async () => {
    return [
      { label: "mock golden retriever", score: 0.85 },
      { label: "mock labrador", score: 0.1 },
      { label: "mock beagle", score: 0.05 },
    ];
  }) as unknown as AllTasks["image-classification"];
};

export const getMockImageToText = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["image-to-text"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  return (async () => {
    return [{ generated_text: "a mock caption of a cute animal" }];
  }) as unknown as AllTasks["image-to-text"];
};

export const getMockDepthEstimation = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["depth-estimation"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  return (async () => {
    return {
      depth: {
        width: 10,
        height: 10,
        channels: 1,
        data: new Uint8Array(100),
      },
    };
  }) as unknown as AllTasks["depth-estimation"];
};

export const getMockObjectDetection = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["object-detection"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  return (async () => {
    return [{ score: 0.99, label: "person", box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 } }];
  }) as unknown as AllTasks["object-detection"];
};

export const getMockSpeechRecognition = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["automatic-speech-recognition"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  const mockTranscriber = async (_audio: unknown, options: unknown) => {
    const { streamer } = options as { streamer?: MockStreamer };
    await simulateStream(streamer);
    return {
      text: "mock transcribed text",
      chunks: [{ timestamp: [0, 999999], text: "mock transcribed text" }],
    };
  };
  mockTranscriber.tokenizer = getSharedMockTokenizer();
  return mockTranscriber as unknown as AllTasks["automatic-speech-recognition"];
};

export const getMockSummarization = async (
  model: string,
  progress_callback: (info: unknown) => void
): Promise<AllTasks["summarization"]> => {
  progress_callback({ status: "initiate", name: model, file: "mock" });
  progress_callback({ status: "ready", name: model, file: "mock" });

  const mockSummarizer = async (_text: unknown, options: unknown) => {
    const { streamer } = options as { streamer?: MockStreamer };
    await simulateStream(streamer);
    return [{ summary_text: "mock summary text" }];
  };
  mockSummarizer.tokenizer = getSharedMockTokenizer();
  return mockSummarizer as unknown as AllTasks["summarization"];
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

export const getMockMusicgen = async (
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
        data: new Float32Array([0.1, -0.2, 0.3]),
      };
    },
    config: { audio_encoder: { sampling_rate: 32000 } },
  };

  return [mockTokenizer as unknown as PreTrainedTokenizer, mockModel as unknown as PreTrainedModel];
};

export const getMockVoiceCloning = async (
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
        data: new Float32Array([0.05, -0.1, 0.15, -0.2, 0.25, 0.1, -0.05]),
      };
    },
    config: { audio_encoder: { sampling_rate: 24000 } },
  };

  return [mockTokenizer as unknown as PreTrainedTokenizer, mockModel as unknown as PreTrainedModel];
};
