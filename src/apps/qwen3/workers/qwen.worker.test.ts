import { vi, describe, it, expect, beforeEach } from "vitest";

const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock global self for the worker environment
vi.stubGlobal("self", {
  addEventListener: addEventListenerMock,
  postMessage: postMessageMock,
});
vi.stubGlobal("navigator", {
  gpu: {
    requestAdapter: vi.fn().mockResolvedValue({}),
  },
});

const mockGenerate = vi.fn().mockResolvedValue({
  past_key_values: null,
  sequences: [[1, 2, 3]],
});
const mockBatchDecode = vi.fn().mockReturnValue("Hello world");
const mockApplyChatTemplate = vi.fn().mockReturnValue({ input_ids: [1] });
const mockEncode = vi.fn().mockReturnValue([10, 11]);

const mockTokenizerFunction = vi.fn().mockReturnValue({ input_ids: [1] });
Object.assign(mockTokenizerFunction, {
  apply_chat_template: mockApplyChatTemplate,
  encode: mockEncode,
  batch_decode: mockBatchDecode,
});

vi.mock("@huggingface/transformers", () => {
  return {
    AutoTokenizer: {
      from_pretrained: vi.fn().mockResolvedValue(mockTokenizerFunction),
    },
    AutoModelForCausalLM: {
      from_pretrained: vi.fn().mockResolvedValue({
        generate: mockGenerate,
      }),
    },
    TextStreamer: class {
      constructor() {}
    },
    InterruptableStoppingCriteria: class {
      reset() {}
      interrupt() {}
    },
    env: {
      allowLocalModels: false,
      useBrowserCache: true,
      backends: {
        onnx: {
          wasm: {
            proxy: false
          }
        }
      }
    }
  };
});

describe("qwen.worker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    await import("./qwen.worker.ts");
  });

  it("should register message event listener", () => {
    expect(addEventListenerMock).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should handle 'check' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];
    await messageHandler({ data: { type: "check" } });
    expect(postMessageMock).not.toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
  });

  it("should handle 'load' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];
    await messageHandler({ data: { type: "load" } });
    await new Promise((r) => setTimeout(r, 50));

    expect(postMessageMock).toHaveBeenCalledWith(expect.objectContaining({ type: "loading" }));
    expect(postMessageMock).toHaveBeenCalledWith(expect.objectContaining({ type: "ready" }));
    expect(mockGenerate).toHaveBeenCalled();
  });

  it("should handle 'generate' message", async () => {
    const messageHandler = addEventListenerMock.mock.calls[0][1];
    await messageHandler({ data: { type: "generate", data: { messages: [{ role: "user", content: "Hi" }], reasonEnabled: false } } });
    await new Promise((r) => setTimeout(r, 50));

    expect(postMessageMock).toHaveBeenCalledWith({ type: "start" });
    expect(mockGenerate).toHaveBeenCalled();
    expect(postMessageMock).toHaveBeenCalledWith({ type: "complete", result: "Hello world" });
  });
});
