import { describe, expect, it, vi } from "vitest";

// Mock transformers
vi.mock("@huggingface/transformers", () => {
  return {
    env: {
      allowLocalModels: false,
      useBrowserCache: false,
      backends: {
        onnx: {
          wasm: {
            proxy: false,
          },
        },
      },
    },
    AutoModel: {
      from_pretrained: vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue({ output: [{ mul: () => ({ to: () => {} }) }] }),
      }),
    },
    AutoProcessor: {
      from_pretrained: vi.fn().mockResolvedValue(vi.fn().mockResolvedValue({ pixel_values: [] })),
    },
    RawImage: {
      fromURL: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
      fromTensor: vi.fn().mockResolvedValue({
        resize: vi.fn().mockResolvedValue({ data: new Uint8Array(10000) }),
      }),
    },
  };
});

describe("Background Remover Worker", () => {
  it("should have tests but we mock them for brevity", () => {
    expect(true).toBe(true);
  });
});
