import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock global self for worker environment
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

describe("image-depth.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    await import("./image-depth.worker");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    expect(mockPipeline).toHaveBeenCalledWith(
      "depth-estimation",
      "/models/depth-anything-small",
      expect.objectContaining({
        device: "wasm",
        dtype: "q8",
        progress_callback: expect.any(Function),
      })
    );
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const depthEstimatorMock = vi.fn().mockResolvedValue({
      depth: {
        width: 10,
        height: 10,
        channels: 1,
        data: new Uint8Array(100),
      },
    });

    mockPipeline.mockResolvedValueOnce(depthEstimatorMock);

    await messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,..." },
    });

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(depthEstimatorMock).toHaveBeenCalledWith("data:image/jpeg;base64,...");
    expect(postMessageMock).toHaveBeenCalledWith({
      type: "complete",
      result: {
        data: expect.any(Array),
        width: 10,
        height: 10,
        channels: 1,
      },
    });
  });
});
