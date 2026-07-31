import { describe, it, expect, vi } from "vitest";
import {
  createWorkerMessageHandler,
  type WorkerCallbacks,
  type CaptionChunk,
} from "./worker-message-handler";

describe("video-captioning worker-message-handler", () => {
  it("should handle different worker messages and call appropriate callbacks", () => {
    const callbacks: WorkerCallbacks<CaptionChunk[]> = {
      setStatus: vi.fn(),
      setProgressItems: vi.fn(),
      onReady: vi.fn(),
      onComplete: vi.fn(),
      setErrorMsg: vi.fn(),
    };

    const handler = createWorkerMessageHandler(callbacks);

    // Test 'progress' message
    handler(
      new MessageEvent("message", {
        data: { type: "progress", data: { file: "model.bin", progress: 50 } },
      })
    );
    expect(callbacks.setStatus).toHaveBeenCalledWith("loading");
    expect(callbacks.setProgressItems).toHaveBeenCalled();

    // Test 'ready' message
    handler(new MessageEvent("message", { data: { type: "ready" } }));
    expect(callbacks.setProgressItems).toHaveBeenCalledTimes(2);
    expect(callbacks.onReady).toHaveBeenCalled();

    // Test 'processing' message
    handler(new MessageEvent("message", { data: { type: "processing" } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("processing");

    // Test 'complete' message
    handler(
      new MessageEvent("message", {
        data: { type: "complete", result: [{ timestamp: [0, 5], text: "hello" }] },
      })
    );
    expect(callbacks.setStatus).toHaveBeenCalledWith("complete");
    expect(callbacks.onComplete).toHaveBeenCalledWith([{ timestamp: [0, 5], text: "hello" }]);

    // Test 'error' message
    handler(
      new MessageEvent("message", { data: { type: "error", error: "Something went wrong" } })
    );
    expect(callbacks.setStatus).toHaveBeenCalledWith("error");
    expect(callbacks.setErrorMsg).toHaveBeenCalledWith("Something went wrong");
  });
});
