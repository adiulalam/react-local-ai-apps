import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type DepthResult } from "./worker-message-handler";

describe("worker-message-handler", () => {
  it("should handle progress message", () => {
    const setStatus = vi.fn();
    const setProgressItems = vi.fn();
    const handler = createWorkerMessageHandler<DepthResult>({
      setStatus,
      setProgressItems,
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    });

    handler(
      new MessageEvent("message", {
        data: { type: "progress", data: { file: "model.onnx", progress: 50 } },
      })
    );

    expect(setStatus).toHaveBeenCalledWith("loading");
    expect(setProgressItems).toHaveBeenCalled();
  });

  it("should handle ready message", () => {
    const onReady = vi.fn();
    const setProgressItems = vi.fn();
    const handler = createWorkerMessageHandler<DepthResult>({
      setStatus: vi.fn(),
      setProgressItems,
      onReady,
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    });

    handler(new MessageEvent("message", { data: { type: "ready" } }));

    expect(setProgressItems).toHaveBeenCalled();
    expect(onReady).toHaveBeenCalled();
  });

  it("should handle processing message", () => {
    const setStatus = vi.fn();
    const handler = createWorkerMessageHandler<DepthResult>({
      setStatus,
      setProgressItems: vi.fn(),
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    });

    handler(new MessageEvent("message", { data: { type: "processing" } }));

    expect(setStatus).toHaveBeenCalledWith("processing");
  });

  it("should handle complete message", () => {
    const setStatus = vi.fn();
    const onComplete = vi.fn();
    const result: DepthResult = { data: [0, 128, 255], width: 1, height: 3, channels: 1 };
    const handler = createWorkerMessageHandler<DepthResult>({
      setStatus,
      setProgressItems: vi.fn(),
      onReady: vi.fn(),
      onComplete,
      setErrorMsg: vi.fn(),
    });

    handler(new MessageEvent("message", { data: { type: "complete", result } }));

    expect(setStatus).toHaveBeenCalledWith("complete");
    expect(onComplete).toHaveBeenCalledWith(result);
  });

  it("should handle error message", () => {
    const setStatus = vi.fn();
    const setErrorMsg = vi.fn();
    const handler = createWorkerMessageHandler<DepthResult>({
      setStatus,
      setProgressItems: vi.fn(),
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg,
    });

    handler(new MessageEvent("message", { data: { type: "error", error: "Test error" } }));

    expect(setStatus).toHaveBeenCalledWith("error");
    expect(setErrorMsg).toHaveBeenCalledWith("Test error");
  });
});
