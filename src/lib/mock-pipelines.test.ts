import { describe, it, expect, vi } from "vitest";
import {
  getMockImageClassification,
  getMockImageToText,
  getMockDepthEstimation,
  getMockObjectDetection,
  getMockSpeechRecognition,
  getMockSummarization,
  getMockBackgroundRemover,
  getMockLLM,
  getMockMusicgen,
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
    const result = await mockPipeline("test-image-data");

    expect(result).toEqual([{ generated_text: "a mock caption of a cute animal" }]);
  });

  it("should return a working depth-estimation mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockDepthEstimation("test-model", progressCallback);
    const result = await mockPipeline("test-image-data");

    expect(result).toHaveProperty("depth");
    expect((result as any).depth).toHaveProperty("width", 10);
    expect((result as any).depth).toHaveProperty("data");
  });

  it("should return a working object-detection mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockObjectDetection("test-model", progressCallback);
    const result = await mockPipeline("test-image-data");

    expect(result).toEqual([
      { score: 0.99, label: "person", box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 } },
    ]);
  });

  it("should return a working automatic-speech-recognition mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockSpeechRecognition("test-model", progressCallback);
    
    // Test the tokenizer property
    expect(mockPipeline).toHaveProperty("tokenizer");
    
    const result = await mockPipeline("test-audio-data", {});
    expect(result).toEqual({ text: "mock transcribed text" });
  });

  it("should return a working summarization mock", async () => {
    const progressCallback = vi.fn();
    const mockPipeline = await getMockSummarization("test-model", progressCallback);
    
    expect(mockPipeline).toHaveProperty("tokenizer");
    
    const result = await mockPipeline("test-text-data", {});
    expect(result).toEqual([{ summary_text: "mock summary text" }]);
  });

  it("should return a working background-remover mock", async () => {
    const progressCallback = vi.fn();
    const [mockModel, mockProcessor] = await getMockBackgroundRemover("test-model", progressCallback);
    
    const processorResult = await (mockProcessor as any)();
    expect(processorResult).toHaveProperty("pixel_values", []);

    const modelResult = await (mockModel as any)();
    expect(modelResult).toHaveProperty("output");
    expect(modelResult.output[0].mul().to().data).toBeInstanceOf(Uint8Array);
  });

  it("should return a working LLM mock", async () => {
    const progressCallback = vi.fn();
    const [mockTokenizer, mockModel] = await getMockLLM("test-model", progressCallback);
    
    expect(mockTokenizer).toBeDefined();
    
    const modelResult = await (mockModel as any).generate({});
    expect(modelResult).toEqual({
      sequences: [[10, 11, 12, 13]],
    });
  });

  it("should return a working musicgen mock", async () => {
    const progressCallback = vi.fn();
    const [mockTokenizer, mockModel] = await getMockMusicgen("test-model", progressCallback);
    
    expect(mockTokenizer).toBeDefined();
    expect((mockModel as any).config.audio_encoder.sampling_rate).toBe(32000);
    
    const modelResult = await (mockModel as any).generate({});
    expect(modelResult.data).toBeInstanceOf(Float32Array);
  });
});
