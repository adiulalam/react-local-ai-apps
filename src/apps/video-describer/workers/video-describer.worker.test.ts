import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock global self for the worker environment
vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

vi.mock("@/lib/utils", () => ({
  isTestEnv: true,
}));

const mockGetMockPipeline = vi.fn();
vi.mock("@/lib/mock-pipelines", () => ({
  getMockImageToText: (...args: unknown[]) => mockGetMockPipeline(...args),
}));

vi.mock("@huggingface/transformers", () => {
  return {
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

describe("video-describer.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    await import("./video-describer.worker.ts");
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
      "Xenova/vit-gpt2-image-captioning",
      expect.any(Function)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const captionerMock = vi
      .fn()
      .mockResolvedValue([{ generated_text: "a person walking on the street" }]);
    mockGetMockPipeline.mockResolvedValueOnce(captionerMock);

    await messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,..." },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(captionerMock).toHaveBeenCalledWith("data:image/jpeg;base64,...", {
      max_new_tokens: 20,
    });
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: "a person walking on the street",
    });
  });
});
