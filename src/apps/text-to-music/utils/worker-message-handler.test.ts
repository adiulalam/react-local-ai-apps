import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type WorkerCallbacks } from "./worker-message-handler";

describe("createWorkerMessageHandler", () => {
  it("should handle 'progress' message", () => {
    const setStatus = vi.fn();
    const setProgressItems = vi.fn();
    const callbacks: WorkerCallbacks = {
      setStatus,
      setProgressItems,
      setStatusText: vi.fn(),
      setProgressPercent: vi.fn(),
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    };

    const handler = createWorkerMessageHandler(callbacks);
    handler({
      data: { type: "progress", data: { file: "model.onnx", progress: 50 } },
    } as MessageEvent);

    expect(setStatus).toHaveBeenCalledWith("loading");
    expect(setProgressItems).toHaveBeenCalled();
  });

  it("should handle 'generating_progress' message", () => {
    const setStatusText = vi.fn();
    const setProgressPercent = vi.fn();
    const callbacks: WorkerCallbacks = {
      setStatus: vi.fn(),
      setProgressItems: vi.fn(),
      setStatusText,
      setProgressPercent,
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    };

    const handler = createWorkerMessageHandler(callbacks);
    handler({
      data: { type: "generating_progress", statusText: "Generating (25%)...", progress: 25 },
    } as MessageEvent);

    expect(setStatusText).toHaveBeenCalledWith("Generating (25%)...");
    expect(setProgressPercent).toHaveBeenCalledWith(25);
  });
});
