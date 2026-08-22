import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type WorkerCallbacks } from "./worker-message-handler";

describe("gemma3 worker-message-handler", () => {
  const callbacks = {
    setStatus: vi.fn(),
    setLoadingMessage: vi.fn(),
    setProgressItems: vi.fn(),
    onReady: vi.fn(),
    onStart: vi.fn(),
    onUpdate: vi.fn(),
    onComplete: vi.fn(),
    setErrorMsg: vi.fn(),
  } as unknown as WorkerCallbacks;

  const handler = createWorkerMessageHandler(callbacks);

  it("handles loading message", () => {
    handler(new MessageEvent("message", { data: { type: "loading", data: "Loading..." } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("loading");
    expect(callbacks.setLoadingMessage).toHaveBeenCalledWith("Loading...");
  });

  it("handles initiate progress message", () => {
    const data = { status: "initiate", file: "model.bin" };
    handler(new MessageEvent("message", { data: { type: "progress", data } }));

    const updater = vi.mocked(callbacks.setProgressItems).mock.calls[0][0];
    const newState = updater([]);
    expect(newState).toEqual([data]);
  });

  it("handles ready message", () => {
    handler(new MessageEvent("message", { data: { type: "ready" } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("ready");
    expect(callbacks.onReady).toHaveBeenCalled();
  });

  it("handles start message", () => {
    handler(new MessageEvent("message", { data: { type: "start" } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("processing");
    expect(callbacks.onStart).toHaveBeenCalled();
  });

  it("handles update message", () => {
    handler(
      new MessageEvent("message", {
        data: { type: "update", result: "Hello", tps: 10, numTokens: 5 },
      })
    );
    expect(callbacks.onUpdate).toHaveBeenCalledWith({
      type: "update",
      result: "Hello",
      tps: 10,
      numTokens: 5,
    });
  });

  it("handles complete message", () => {
    handler(new MessageEvent("message", { data: { type: "complete" } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("complete");
    expect(callbacks.onComplete).toHaveBeenCalled();
  });

  it("handles error message", () => {
    handler(
      new MessageEvent("message", { data: { type: "error", error: "Something went wrong" } })
    );
    expect(callbacks.setStatus).toHaveBeenCalledWith("error");
    expect(callbacks.setErrorMsg).toHaveBeenCalledWith("Something went wrong");
  });
});
