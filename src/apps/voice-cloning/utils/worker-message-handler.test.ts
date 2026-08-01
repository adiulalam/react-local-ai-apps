import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type WorkerCallbacks } from "./worker-message-handler";

describe("createWorkerMessageHandler", () => {
  const createMockCallbacks = (): WorkerCallbacks => ({
    setStatus: vi.fn(),
    setProgressItems: vi.fn(),
    setStatusText: vi.fn(),
    setProgressPercent: vi.fn(),
    onReady: vi.fn(),
    onComplete: vi.fn(),
    setErrorMsg: vi.fn(),
  });

  it("handles progress messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: {
        type: "progress",
        data: { file: "model.onnx", progress: 50, loaded: 500, total: 1000, status: "progress" },
      },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("loading");
    expect(callbacks.setProgressItems).toHaveBeenCalled();
  });

  it("handles ready messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({ data: { type: "ready" } } as MessageEvent);

    expect(callbacks.onReady).toHaveBeenCalled();
  });

  it("handles generating messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({ data: { type: "generating", text: "Hello" } } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("generating");
    expect(callbacks.setProgressPercent).toHaveBeenCalledWith(0);
  });

  it("handles complete messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);
    const audioData = new Float32Array([1, 2, 3]);

    handler({ data: { type: "complete", audioData, samplingRate: 24000 } } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("complete");
    expect(callbacks.onComplete).toHaveBeenCalledWith(audioData, 24000);
  });

  it("handles error messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({ data: { type: "error", error: "Failed to load model" } } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("error");
    expect(callbacks.setErrorMsg).toHaveBeenCalledWith("Failed to load model");
  });
});
