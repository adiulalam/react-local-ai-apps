import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock global self for the worker environment
vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

const mockPipeline = vi.fn();

import type { PipelineType } from "@huggingface/transformers";

vi.mock("@huggingface/transformers", () => {
  return {
    pipeline: (task: PipelineType, ...args: unknown[]) => mockPipeline(task, ...args),
    env: { allowLocalModels: false, useBrowserCache: true },
    TextStreamer: class {
      constructor() {}
    },
  };
});

describe("summary.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Dynamically import to ensure addEventListener is called in each test
    await import("./summary.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    // Get the registered message handler
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    // Mock pipeline resolution
    mockPipeline.mockResolvedValueOnce(vi.fn());

    // Trigger the load event
    await messageHandler({ data: { type: "load" } });

    // Ensure it attempts to load and posts ready
    expect(mockPipeline).toHaveBeenCalledWith(
      "summarization",
      "Xenova/distilbart-cnn-6-6",
      expect.any(Object)
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    // Mock summarizer function and attach a tokenizer
    const summarizerMock = Object.assign(
      vi.fn().mockResolvedValue([{ summary_text: "Mocked summary" }]),
      { tokenizer: {} }
    );
    summarizerMock.tokenizer = {};
    mockPipeline.mockResolvedValueOnce(summarizerMock);

    await messageHandler({
      data: {
        type: "process",
        text: "Long text to summarize",
        options: { max_length: 50, min_length: 10 },
      },
    });

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(summarizerMock).toHaveBeenCalledWith(
      "Long text to summarize",
      expect.objectContaining({
        max_new_tokens: 50,
        min_length: 10,
        streamer: expect.any(Object),
      })
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "complete", result: "Mocked summary" });
  });
});
