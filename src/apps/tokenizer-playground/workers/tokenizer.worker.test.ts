import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global self for worker context
vi.stubGlobal("self", {
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
});

vi.mock("@/lib/utils", () => ({
  isTestEnv: true,
}));

const mockGetMockLLM = vi.fn();
vi.mock("@/lib/mock-pipelines", () => ({
  getMockLLM: (...args: unknown[]) => mockGetMockLLM(...args),
}));

vi.mock("@huggingface/transformers", () => {
  return {
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
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should initialize without errors", async () => {
    // Just verify the import doesn't crash
    await import("./tokenizer.worker");
    expect(true).toBe(true);
  });
});
