import { describe, it, expect, vi } from "vitest";
import { createWorkerMessageHandler, type WorkerCallbacks } from "./worker-message-handler";

describe("createWorkerMessageHandler", () => {
  const createMockCallbacks = (): WorkerCallbacks => ({
    setStatus: vi.fn(),
    setProgressItems: vi.fn(),
    setStatusText: vi.fn(),
    setProgressPercent: vi.fn(),
    onReady: vi.fn(),
    onSpeakerEncoded: vi.fn(),
    onComplete: vi.fn(),
    setErrorMsg: vi.fn(),
  });

  it("handles load:progress messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: {
        type: "load:progress",
        data: { file: "model.onnx", progress: 50, loaded: 500, total: 1000, status: "progress" },
      },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("loading");
    expect(callbacks.setProgressItems).toHaveBeenCalled();
  });

  it("handles load:complete messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: { type: "load:complete", data: { device: "webgpu", webgpu: true } },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("encoding");
    expect(callbacks.setStatusText).toHaveBeenCalledWith("Encoding reference voice...");
    expect(callbacks.onReady).toHaveBeenCalled();
  });

  it("handles encode_speaker:complete messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: { type: "encode_speaker:complete", data: { id: "user" } },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("generating");
    expect(callbacks.setStatusText).toHaveBeenCalledWith("Generating speech...");
    expect(callbacks.setProgressPercent).toHaveBeenCalledWith(0);
    expect(callbacks.onSpeakerEncoded).toHaveBeenCalled();
  });

  it("handles generate:complete messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);
    const audioBuffer = new Float32Array([1, 2, 3]).buffer;

    handler({
      data: { type: "generate:complete", data: { waveform: audioBuffer } },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("complete");
    expect(callbacks.setProgressPercent).toHaveBeenCalledWith(100);
    expect(callbacks.onComplete).toHaveBeenCalledWith(expect.any(Float32Array), 24000);

    const receivedAudio = (callbacks.onComplete as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Array.from(receivedAudio)).toEqual([1, 2, 3]);
  });

  it("handles error messages", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: { type: "error", data: { message: "Failed to load model" } },
    } as MessageEvent);

    expect(callbacks.setStatus).toHaveBeenCalledWith("error");
    expect(callbacks.setErrorMsg).toHaveBeenCalledWith("Failed to load model");
  });

  it("handles error messages with fallback text", () => {
    const callbacks = createMockCallbacks();
    const handler = createWorkerMessageHandler(callbacks);

    handler({
      data: { type: "error", data: {} },
    } as MessageEvent);

    expect(callbacks.setErrorMsg).toHaveBeenCalledWith(
      "An error occurred during voice cloning"
    );
  });
});
