import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the transformers package
vi.mock("@huggingface/transformers", () => {
  return {
    AutoTokenizer: {
      from_pretrained: vi.fn().mockResolvedValue({
        encode: vi.fn().mockReturnValue([1, 2]),
        decode: vi.fn().mockImplementation(([x]) => `token_${x}`),
        _tokenizer_config: { tokenizer_class: "LlamaTokenizer" },
        decoder: { decoders: [] },
      }),
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

describe("tokenizer worker", () => {
  let workerContext: typeof globalThis;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock self (worker context)
    workerContext = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as typeof globalThis;

    vi.stubGlobal("self", workerContext);
  });

  it("should initialize without errors", async () => {
    // Just verify the import doesn't crash
    await import("./tokenizer.worker");
    expect(true).toBe(true);
  });
});
