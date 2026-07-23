import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the transformers package
vi.mock("@huggingface/transformers", () => {
  return {
    AutoTokenizer: {
      from_pretrained: vi.fn().mockResolvedValue({
        apply_chat_template: vi.fn(),
        encode: vi.fn().mockReturnValue([1, 2]),
        batch_decode: vi.fn().mockReturnValue(["mock output"]),
      }),
    },
    AutoModelForCausalLM: {
      from_pretrained: vi.fn().mockResolvedValue({
        generate: vi.fn().mockResolvedValue({
          past_key_values: {},
          sequences: [[1, 2, 3]],
        }),
      }),
    },
    TextStreamer: vi.fn(),
    InterruptableStoppingCriteria: class {
      reset = vi.fn();
      interrupt = vi.fn();
    },
    env: {
      allowLocalModels: false,
      useBrowserCache: false,
      backends: {
        onnx: {
          wasm: { proxy: false },
        },
      },
    },
  };
});

describe("llama worker", () => {
  let workerContext: typeof globalThis;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock self (worker context)
    workerContext = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as typeof globalThis;

    vi.stubGlobal("self", workerContext);
    vi.stubGlobal("navigator", {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({}),
      },
    });
  });

  it("should initialize without errors", async () => {
    // Just verify the import doesn't crash
    await import("./llama.worker");
    expect(true).toBe(true);
  });
});
