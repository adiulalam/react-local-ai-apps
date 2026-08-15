import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});

const mockPipeline = vi.fn();

import type { PipelineType } from "@huggingface/transformers";

vi.mock("@huggingface/transformers", () => {
  return {
    pipeline: (task: PipelineType, ...args: unknown[]) => mockPipeline(task, ...args),
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

describe("embedding.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();

    await import("./embedding.worker.ts");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    await messageHandler({ data: { type: "load" } });

    vi.runAllTimers();

    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'batch_embed' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    await messageHandler({
      data: { type: "batch_embed", chunks: ["First paragraph", "Second paragraph"] },
    });

    expect(postMessageMock).toHaveBeenCalledWith({
      type: "indexing_progress",
      data: { current: 1, total: 2, percentage: 50 },
    });
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "indexing_progress",
      data: { current: 2, total: 2, percentage: 100 },
    });
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "batch_embed_complete",
      })
    );
  });

  it("should handle 'query_embed' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    await messageHandler({
      data: { type: "query_embed", query: "test search query", queryId: "q1" },
    });

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "query_embed_complete",
        queryId: "q1",
      })
    );
  });
});
