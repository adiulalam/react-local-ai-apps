import { describe, it, expect } from "vitest";
import { SAMPLE_DOCUMENTS } from "./sample-documents";
import { chunkText } from "./text-chunker";

describe("SAMPLE_DOCUMENTS", () => {
  it("should contain at least 3 sample documents", () => {
    expect(SAMPLE_DOCUMENTS.length).toBeGreaterThanOrEqual(3);
  });

  it("should have valid metadata and non-empty content or URL for each sample document", () => {
    for (const sample of SAMPLE_DOCUMENTS) {
      expect(sample.name).toBeTruthy();
      expect(typeof sample.name).toBe("string");

      expect(sample.category).toBeTruthy();
      expect(typeof sample.category).toBe("string");

      expect(["pdf", "text"]).toContain(sample.type);

      expect(sample.description).toBeTruthy();
      expect(typeof sample.description).toBe("string");

      expect(Array.isArray(sample.sampleQueries)).toBe(true);
      expect(sample.sampleQueries.length).toBeGreaterThanOrEqual(2);

      for (const query of sample.sampleQueries) {
        expect(query.trim().length).toBeGreaterThan(5);
      }

      if (sample.type === "pdf") {
        expect(sample.url).toBeDefined();
        expect(sample.url?.endsWith(".pdf")).toBe(true);
      } else {
        expect(sample.text).toBeDefined();
        expect(sample.text!.length).toBeGreaterThan(50);
      }
    }
  });

  it("should successfully chunk all text-based sample documents into valid chunks", () => {
    const textSamples = SAMPLE_DOCUMENTS.filter(
      (s) => s.type === "text" && typeof s.text === "string"
    );
    expect(textSamples.length).toBeGreaterThan(0);

    for (const sample of textSamples) {
      const chunks = chunkText(sample.text!);
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.id).toMatch(/^chunk-\d+$/);
        expect(chunk.text.trim().length).toBeGreaterThan(0);
        expect(chunk.wordCount).toBeGreaterThan(0);
      }
    }
  });
});
