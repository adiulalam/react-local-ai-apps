import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type WorkerCallbacks } from "./worker-message-handler";

describe("tokenizer worker-message-handler", () => {
  const callbacks = {
    setStatus: vi.fn(),
    setLoadingMessage: vi.fn(),
    setProgressItems: vi.fn(),
    onReady: vi.fn(),
    onTokenized: vi.fn(),
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

    // Verify it updates state by calling the updater function
    const updater = vi.mocked(callbacks.setProgressItems).mock.calls[0][0];
    const newState = updater([]);
    expect(newState).toEqual([data]);
  });

  it("handles ready message", () => {
    handler(new MessageEvent("message", { data: { type: "ready" } }));
    expect(callbacks.setStatus).toHaveBeenCalledWith("ready");
    expect(callbacks.onReady).toHaveBeenCalled();
  });

  it("handles tokenized message", () => {
    const tokenizedData = { token_ids: [1, 2], decoded: ["hello", "world"], margins: [0, 8] };
    handler(
      new MessageEvent("message", {
        data: { type: "tokenized", data: tokenizedData },
      })
    );
    expect(callbacks.onTokenized).toHaveBeenCalledWith(tokenizedData);
  });

  it("handles error message", () => {
    handler(
      new MessageEvent("message", { data: { type: "error", error: "Something went wrong" } })
    );
    expect(callbacks.setStatus).toHaveBeenCalledWith("error");
    expect(callbacks.setErrorMsg).toHaveBeenCalledWith("Something went wrong");
  });
});
