import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock global self for worker environment
vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

vi.mock("@/lib/utils", () => ({
  isTestEnv: true,
}));

const mockGetMockPipeline = vi.fn();
vi.mock("@/lib/mock-pipelines", () => ({
  getMockPipeline: (...args: unknown[]) => mockGetMockPipeline(...args),
}));

vi.mock("@huggingface/transformers", () => {
  return {
    TextStreamer: class {
      constructor() {}
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

describe("whisper.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import("./whisper.worker");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockGetMockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetMockPipeline).toHaveBeenCalledWith(
      "automatic-speech-recognition",
      "onnx-community/whisper-base",
      expect.any(Function)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const transcriberMock = Object.assign(vi.fn().mockResolvedValue({ text: "Hello, world!" }), {
      tokenizer: {},
    });
    mockGetMockPipeline.mockResolvedValueOnce(transcriberMock);

    await messageHandler({
      data: { type: "process", audio: new Float32Array([0.1, 0.2, 0.3]) },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(transcriberMock).toHaveBeenCalledWith(
      expect.any(Float32Array),
      expect.objectContaining({
        chunk_length_s: 30,
        stride_length_s: 5,
        language: "en",
        task: "transcribe",
        streamer: expect.any(Object),
      })
    );
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: "Hello, world!",
    });
  });
});
