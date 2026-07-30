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
  getMockDepthEstimation: (...args: unknown[]) => mockGetMockPipeline(...args),
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

    mockGetMockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    // Allow promise resolution
    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetMockPipeline).toHaveBeenCalledWith(
      "Xenova/depth-anything-small-hf",
      expect.any(Function)
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

    mockGetMockPipeline.mockResolvedValueOnce(depthEstimatorMock);

    await messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,..." },
    });

    await new Promise((r) => setTimeout(r, 10));

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
