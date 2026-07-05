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
    env: { allowLocalModels: false, useBrowserCache: true },
    TextStreamer: class { constructor() {} },
  };
});

describe("whisper.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Dynamically import to ensure addEventListener is called in each test
    await import("./whisper.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    // Mock pipeline resolution
    mockPipeline.mockResolvedValueOnce(vi.fn());

    await messageHandler({ data: { type: "load" } });

    expect(mockPipeline).toHaveBeenCalledWith("automatic-speech-recognition", "onnx-community/whisper-base", expect.any(Object));
    expect(postMessageMock).toHaveBeenCalledWith({ type: "ready" });
  });

  it("should handle 'process' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];

    const transcriberMock = Object.assign(
      vi.fn().mockResolvedValue({ text: "Mocked transcription" }),
      { tokenizer: {} }
    );
    mockPipeline.mockResolvedValueOnce(transcriberMock);

    await messageHandler({ data: { type: "process", audio: new Float32Array(0) } });

    expect(postMessageMock).toHaveBeenCalledWith({ type: "processing" });
    expect(transcriberMock).toHaveBeenCalledWith(expect.any(Float32Array), expect.objectContaining({
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "en",
      task: "transcribe",
      streamer: expect.any(Object)
    }));
    expect(postMessageMock).toHaveBeenCalledWith({ type: "complete", result: "Mocked transcription" });
  });
});
