import { describe, it, expect, vi } from "vitest";
import {
  getMockImageClassification,
  getMockImageToText,
  getMockDepthEstimation,
  getMockObjectDetection,
} from "./mock-pipelines";

describe("mock-pipelines", () => {
  it("should trigger progress callbacks when getting a mock pipeline", async () => {
    const progressCallback = vi.fn();
    await getMockImageClassification("test-model", progressCallback);

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
    const mockPipeline = await getMockImageClassification("test-model", progressCallback);

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
    const mockPipeline = await getMockImageToText("test-model", progressCallback);

    // The mock pipeline is an async function
    const result = await mockPipeline("test-image-data");

    expect(result).toEqual([{ generated_text: "a mock caption of a cute animal" }]);
  });
});
