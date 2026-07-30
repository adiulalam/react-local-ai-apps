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

describe("summary.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import("./summary.worker");
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
      "summarization",
      "/models/tiny-bart",
      expect.any(Function)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const summarizerMock = Object.assign(
      vi.fn().mockResolvedValue([{ summary_text: "This is a summary." }]),
      { tokenizer: {} }
    );
    mockGetMockPipeline.mockResolvedValueOnce(summarizerMock);

    await messageHandler({
      data: {
        type: "process",
        text: "This is a long text that needs to be summarized.",
        options: { max_length: 50, min_length: 10 },
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(summarizerMock).toHaveBeenCalledWith(
      "This is a long text that needs to be summarized.",
      expect.objectContaining({
        max_new_tokens: 20,
        min_length: 5,
        truncation: true,
        streamer: expect.any(Object),
      })
    );
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: "This is a summary.",
    });
  });
});
