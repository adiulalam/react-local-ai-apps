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

describe("object-detection.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    await import("./object-detection.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    expect(mockPipeline).toHaveBeenCalledWith(
      "object-detection",
      "/models/yolos-tiny",
      expect.objectContaining({
        device: "wasm",
        progress_callback: expect.any(Function),
      })
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const detectorMock = vi
      .fn()
      .mockResolvedValue([
        { score: 0.99, label: "person", box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 } },
      ]);
    mockPipeline.mockResolvedValueOnce(detectorMock);

    await messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,...", threshold: 0.5 },
    });

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(detectorMock).toHaveBeenCalledWith("data:image/jpeg;base64,...", {
      threshold: 0.5,
      percentage: true,
    });
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: [
        { score: 0.99, label: "person", box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 } },
      ],
    });
  });
});
