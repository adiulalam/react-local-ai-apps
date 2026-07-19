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

describe("image-classification.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    await import("./image-classification.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    mockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    expect(mockPipeline).toHaveBeenCalledWith("image-classification", "/models/mobilenet-tiny", expect.any(Object));
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const classifierMock = vi.fn().mockResolvedValue([
      { label: "cat", score: 0.99 },
    ]);
    mockPipeline.mockResolvedValueOnce(classifierMock);

    await messageHandler({ data: { type: "process", image: "data:image/jpeg;base64,..." } });

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(classifierMock).toHaveBeenCalledWith("data:image/jpeg;base64,...", { top_k: 5 });
    expect(postMessageMock).toHaveBeenCalledWith({ type: "complete", result: [{ label: "cat", score: 0.99 }] });
  });
});
