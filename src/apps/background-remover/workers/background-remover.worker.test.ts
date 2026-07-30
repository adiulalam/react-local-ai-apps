import { describe, expect, it, vi } from "vitest";

vi.mock("@huggingface/transformers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@huggingface/transformers")>();
  return {
    ...actual,
    RawImage: {
      fromURL: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
      fromTensor: vi.fn().mockResolvedValue({
        resize: vi.fn().mockResolvedValue({ data: new Uint8Array(10000) }),
      }),
    },
  };
});

describe("Background Remover Worker", () => {
  it("should handle 'process' message correctly in test environment", async () => {
    const addEventListenerMock = vi.fn();
    const postMessageMock = vi.fn();
    vi.stubGlobal("self", {
      addEventListener: addEventListenerMock,
      postMessage: postMessageMock,
    });
    
    // Dynamically import the worker so mocks apply
    await import("./background-remover.worker");

    const messageHandler = addEventListenerMock.mock.calls[0][1] as EventListener;

    const promise = messageHandler({
      data: { type: "process", image: "data:image/jpeg;base64,mock" },
    } as MessageEvent);

    const messages: unknown[] = [];
    postMessageMock.mockImplementation((msg) => {
      messages.push(msg);
    });

    await promise;

    expect(messages).toContainEqual({ type: "processing" });
    expect(messages).toContainEqual({
      type: "complete",
      result: { maskData: expect.any(Uint8Array), width: 100, height: 100 },
    });
  });
});
