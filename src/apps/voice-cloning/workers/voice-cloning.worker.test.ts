import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

vi.mock("@/lib/utils", () => ({
  isTestEnv: true,
}));

const mockGetMockVoiceCloning = vi.fn();
vi.mock("@/lib/mock-pipelines", () => ({
  getMockVoiceCloning: (...args: unknown[]) => mockGetMockVoiceCloning(...args),
}));

vi.mock("@huggingface/transformers", () => {
  return {
    ChatterboxModel: {
      from_pretrained: vi.fn(),
    },
    AutoProcessor: {
      from_pretrained: vi.fn(),
    },
    BaseStreamer: class {},
    Tensor: class {
      type: string;
      data: Float32Array;
      shape: number[];
      constructor(type: string, data: Float32Array, shape: number[]) {
        this.type = type;
        this.data = data;
        this.shape = shape;
      }
    },
    env: {
      allowLocalModels: false,
      useBrowserCache: true,
      backends: {
        onnx: {
          wasm: {
            proxy: false,
          },
        },
      },
    },
  };
});

describe("voice-cloning.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import("./voice-cloning.worker");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const mockProcessor = {
      _call: vi.fn().mockResolvedValue({ input_ids: [1, 2, 3], attention_mask: [1, 1, 1] }),
    };
    const mockModel = {
      encode_speech: vi.fn().mockResolvedValue({ speaker_embeddings: new Float32Array([0.1]) }),
      generate: vi.fn().mockResolvedValue({ data: new Float32Array([0.05, -0.1]) }),
      config: { audio_encoder: { sampling_rate: 24000 } },
    };
    mockGetMockVoiceCloning.mockResolvedValueOnce([mockProcessor, mockModel]);

    await messageHandler({ data: { type: "load", data: {} } });
    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetMockVoiceCloning).toHaveBeenCalledWith(
      "ResembleAI/chatterbox-turbo-ONNX",
      expect.any(Function)
    );
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "load:complete",
      data: {},
    });
  });

  it("should handle 'encode_speaker' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const mockSpeakerResult = { speaker_embeddings: new Float32Array([0.1, 0.2]) };
    const mockProcessor = {
      _call: vi.fn(),
    };
    const mockModel = {
      encode_speech: vi.fn().mockResolvedValue(mockSpeakerResult),
      generate: vi.fn(),
      config: { audio_encoder: { sampling_rate: 24000 } },
    };
    mockGetMockVoiceCloning.mockResolvedValueOnce([mockProcessor, mockModel]);

    // Load first
    await messageHandler({ data: { type: "load", data: {} } });
    await new Promise((r) => setTimeout(r, 0));

    // Then encode speaker
    const audioData = new Float32Array([0.5, -0.3, 0.1]);
    await messageHandler({
      data: { type: "encode_speaker", data: { id: "user", audioData } },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(mockModel.encode_speech).toHaveBeenCalled();
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "encode_speaker:complete",
      data: { id: "user" },
    });
  });

  it("should handle 'generate' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const mockSpeakerResult = { speaker_embeddings: new Float32Array([0.1]) };
    const mockAudio = new Float32Array([0.05, -0.1, 0.15, -0.2]);
    const mockProcessor = {
      _call: vi.fn().mockResolvedValue({ input_ids: [1, 2, 3], attention_mask: [1, 1, 1] }),
    };
    const mockModel = {
      encode_speech: vi.fn().mockResolvedValue(mockSpeakerResult),
      generate: vi.fn().mockResolvedValue({ data: mockAudio }),
      config: { audio_encoder: { sampling_rate: 24000 } },
    };
    mockGetMockVoiceCloning.mockResolvedValueOnce([mockProcessor, mockModel]);

    // Load
    await messageHandler({ data: { type: "load", data: {} } });
    await new Promise((r) => setTimeout(r, 0));

    // Encode speaker
    await messageHandler({
      data: { type: "encode_speaker", data: { id: "user", audioData: new Float32Array([0.5]) } },
    });
    await new Promise((r) => setTimeout(r, 0));

    // Generate
    await messageHandler({
      data: {
        type: "generate",
        data: {
          text: "Hello from local AI voice cloning!",
          speakerId: "user",
          exaggeration: 0.5,
        },
      },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(mockProcessor._call).toHaveBeenCalledWith("Hello from local AI voice cloning!");

    expect(mockModel.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        input_ids: [1, 2, 3],
        attention_mask: [1, 1, 1],
        speaker_embeddings: expect.any(Float32Array),
        exaggeration: 0.5,
        max_new_tokens: 256,
      })
    );

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "generate:complete",
        data: {
          waveform: expect.any(ArrayBuffer),
        },
      }),
      { transfer: [expect.any(ArrayBuffer)] }
    );
  });

  it("should handle errors during load", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockGetMockVoiceCloning.mockRejectedValueOnce(new Error("Load failed"));

    await messageHandler({ data: { type: "load", data: {} } });
    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "error",
      data: expect.objectContaining({ message: "Load failed" }),
    });
  });

  it("should handle errors when generating without loading", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    await messageHandler({
      data: {
        type: "generate",
        data: { text: "Test", speakerId: "user" },
      },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "error",
      data: expect.objectContaining({ message: "Model not loaded" }),
    });
  });
});
