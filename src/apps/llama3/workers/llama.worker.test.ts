import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@huggingface/transformers", () => {
  return {
    AutoTokenizer: {},
    AutoModelForCausalLM: {},
    TextStreamer: class {},
    InterruptableStoppingCriteria: class {
      reset = vi.fn();
      interrupt = vi.fn();
    },
    env: { backends: { onnx: { wasm: { proxy: false } } } },
    DynamicCache: class {},
  };
});

describe("llama.worker", () => {
  let workerContext: typeof globalThis;

  beforeEach(() => {
    vi.clearAllMocks();
    workerContext = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as typeof globalThis;
    vi.stubGlobal("self", workerContext);
    vi.stubGlobal("navigator", {
      gpu: { requestAdapter: vi.fn().mockResolvedValue({}) },
      userAgent: "node",
    });
  });

  it("should handle 'generate' message correctly in test environment", async () => {
    const addEventListenerMock = vi.fn();
    const postMessageMock = vi.fn();
    vi.stubGlobal("self", {
      addEventListener: addEventListenerMock,
      postMessage: postMessageMock,
    });

    await import("./llama.worker");

    const messageHandler = addEventListenerMock.mock.calls[0][1] as EventListener;

    const messages: unknown[] = [];
    postMessageMock.mockImplementation((msg) => {
      messages.push(msg);
    });

    const promise = messageHandler({
      data: { type: "generate", data: { messages: [] } },
    } as MessageEvent);

    await promise;
    await new Promise((r) => setTimeout(r, 100));

    expect(messages).toContainEqual({ type: "start" });
    expect(messages).toContainEqual(expect.objectContaining({ type: "complete" }));
  });
});
