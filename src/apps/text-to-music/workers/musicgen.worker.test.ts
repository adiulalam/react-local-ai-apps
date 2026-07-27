import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

const mockTokenizerFromPretrained = vi.fn();
const mockModelFromPretrained = vi.fn();

vi.mock("@huggingface/transformers", () => {
  return {
    AutoTokenizer: {
      from_pretrained: (...args: unknown[]) => mockTokenizerFromPretrained(...args),
    },
    MusicgenForConditionalGeneration: {
      from_pretrained: (...args: unknown[]) => mockModelFromPretrained(...args),
    },
    RawAudio: class {
      constructor() {}
      toBlob() {
        return new Blob([], { type: "audio/wav" });
      }
    },
    BaseStreamer: class {},
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

describe("musicgen.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import("./musicgen.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockTokenizerFromPretrained.mockResolvedValueOnce(vi.fn());
    mockModelFromPretrained.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    expect(mockTokenizerFromPretrained).toHaveBeenCalledWith(
      "/models/text-to-audio-tiny",
      expect.any(Object)
    );
    expect(mockModelFromPretrained).toHaveBeenCalledWith(
      "/models/text-to-audio-tiny",
      expect.any(Object)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'generate' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const tokenizerMock = vi.fn().mockReturnValue({ input_ids: [1, 2, 3] });
    const mockAudio = new Float32Array([0.1, -0.2, 0.3]);
    const generateMock = vi.fn().mockResolvedValue({
      data: mockAudio,
    });
    const modelMock = {
      generate: generateMock,
      config: { audio_encoder: { sampling_rate: 32000 } },
    };

    mockTokenizerFromPretrained.mockResolvedValueOnce(tokenizerMock);
    mockModelFromPretrained.mockResolvedValueOnce(modelMock);

    await messageHandler({
      data: {
        type: "generate",
        text: "80s pop track",
        duration: 10,
        guidanceScale: 3.0,
        temperature: 1.0,
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "generating",
      text: "80s pop track",
    });

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input_ids: [1, 2, 3],
        do_sample: true,
        guidance_scale: 3.0,
        temperature: 1.0,
        max_new_tokens: 500,
        streamer: expect.any(Object),
      })
    );

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      audioData: mockAudio,
      samplingRate: 32000,
    });
  });
});
