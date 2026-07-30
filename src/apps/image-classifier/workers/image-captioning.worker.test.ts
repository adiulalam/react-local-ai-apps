import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

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

describe("image-captioning.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();

    await import("./image-captioning.worker.ts");
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

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const promise = messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,..." },
    });

    // Advance timers so the mock setTimeout resolves
    await vi.runAllTimersAsync();
    await promise;

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: "a mock caption of a cute animal",
    });
  });
});
