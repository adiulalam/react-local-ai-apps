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
    AutoTokenizer: {
      from_pretrained: vi.fn(),
    },
    AutoModel: {
      from_pretrained: vi.fn(),
    },
    BaseStreamer: class {
      constructor() {}
      put() {}
      end() {}
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

    mockGetMockVoiceCloning.mockResolvedValueOnce([{}, {}]);

    await messageHandler({ data: { type: "load" } });

    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetMockVoiceCloning).toHaveBeenCalledWith(
      "onnx-community/chatterbox-ONNX",
      expect.any(Function)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'generate' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const tokenizerMock = vi.fn().mockReturnValue({ input_ids: [1, 2, 3] });
    const mockAudio = new Float32Array([0.05, -0.1, 0.15, -0.2]);
    const generateMock = vi.fn().mockResolvedValue({
      data: mockAudio,
    });
    const modelMock = {
      generate: generateMock,
      config: { audio_encoder: { sampling_rate: 24000 } },
    };

    mockGetMockVoiceCloning.mockResolvedValueOnce([tokenizerMock, modelMock]);

    await messageHandler({
      data: {
        type: "generate",
        text: "Hello from local AI voice cloning!",
        audioData: new Float32Array([0, 1]),
        exaggeration: 0.5,
        temperature: 0.8,
        repetitionPenalty: 1.2,
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "generating",
      text: "Hello from local AI voice cloning!",
    });

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input_ids: [1, 2, 3],
        do_sample: true,
        temperature: 0.8,
        repetition_penalty: 1.2,
        exaggeration: 0.5,
        max_new_tokens: 256,
        streamer: expect.any(Object),
      })
    );

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      audioData: mockAudio,
      samplingRate: 24000,
    });
  });
});
