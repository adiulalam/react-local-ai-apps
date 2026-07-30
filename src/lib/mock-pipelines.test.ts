import { describe, it, expect, vi } from "vitest";
import { getMockPipeline } from "./mock-pipelines";

describe("mock-pipelines", () => {
  it("should trigger progress callbacks when getting a mock pipeline", async () => {
    const progressCallback = vi.fn();
    await getMockPipeline("image-classification", "test-model", progressCallback);

    expect(progressCallback).toHaveBeenCalledTimes(2);
    expect(progressCallback).toHaveBeenNthCalledWith(1, {
      status: "initiate",
      name: "test-model",
      file: "mock",
    });
    expect(progressCallback).toHaveBeenNthCalledWith(2, {
      status: "ready",
      name: "test-model",
      file: "mock",
    });
  });

  it("should return a working image-classification mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockPipeline(
      "image-classification",
      "test-model",
      progressCallback
    );

    // The mock pipeline is an async function
    const result = await mockPipeline("test-image-data");

    expect(result).toEqual([
      { label: "mock golden retriever", score: 0.85 },
      { label: "mock labrador", score: 0.1 },
      { label: "mock beagle", score: 0.05 },
    ]);
  });

  it("should return a working image-to-text mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockPipeline("image-to-text", "test-model", progressCallback);

    // The mock pipeline is an async function
    const result = await mockPipeline("test-image-data");

    expect(result).toEqual([{ generated_text: "a mock caption of a cute animal" }]);
  });

  it("should throw an error for unimplemented tasks", async () => {
    const progressCallback = vi.fn();

    await expect(getMockPipeline("ner", "test-model", progressCallback)).rejects.toThrow(
      "Mock pipeline not implemented for task: ner"
    );
  });
});
