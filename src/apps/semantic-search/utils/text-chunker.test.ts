import { describe, it, expect } from "vitest";
import { chunkText } from "./text-chunker";

describe("chunkText", () => {
  it("should return an empty array for empty or whitespace-only text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\t  \n  ")).toEqual([]);
  });

  it("should normalize Windows CRLF line endings properly", () => {
    const text = "Paragraph 1 line.\r\n\r\nParagraph 2 line.\r\n\r\nParagraph 3 line.";
    const chunks = chunkText(text, {
      strategy: "paragraph",
      targetChunkWords: 10,
      minChunkWords: 2,
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).not.toContain("\r");
  });

  it("should chunk by paragraph strategy and combine small paragraphs up to targetChunkWords", () => {
    const text = `The quick brown fox jumps over the lazy dog.

Artificial intelligence models process natural language.

Vector embeddings enable fast semantic search.`;

    const chunks = chunkText(text, {
      strategy: "paragraph",
      targetChunkWords: 30,
      overlapWords: 5,
      minChunkWords: 3,
    });

    expect(chunks.length).toBe(1);
    expect(chunks[0].id).toBe("chunk-1");
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].wordCount).toBe(21);
    expect(chunks[0].preview).toBeDefined();
    expect(chunks[0].charStart).toBeGreaterThanOrEqual(0);
    expect(chunks[0].charEnd).toBeGreaterThan(chunks[0].charStart);
  });

  it("should create multiple chunks with overlap when text exceeds targetChunkWords", () => {
    const paragraph1 = Array(15).fill("word").join(" ");
    const paragraph2 = Array(15).fill("test").join(" ");
    const paragraph3 = Array(15).fill("data").join(" ");
    const fullText = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;

    const chunks = chunkText(fullText, {
      strategy: "paragraph",
      targetChunkWords: 20,
      overlapWords: 5,
      minChunkWords: 5,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].id).toBe("chunk-1");
    expect(chunks[1].id).toBe("chunk-2");
    expect(chunks[1].index).toBe(1);
  });

  it("should subdivide unusually large paragraphs by sentence boundaries", () => {
    const sentence1 =
      "Transformers revolutionized natural language processing by introducing self-attention mechanisms.";
    const sentence2 =
      "Instead of sequential recurrence, attention calculates pairwise token relationships simultaneously.";
    const sentence3 =
      "Positional encodings inject positional information into token representations.";
    const sentence4 =
      "Residual connections ensure stable gradient propagation across deep multi-layer networks.";
    const largeParagraph = `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;

    const chunks = chunkText(largeParagraph, {
      strategy: "paragraph",
      targetChunkWords: 15,
      overlapWords: 3,
      minChunkWords: 5,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.wordCount).toBeGreaterThanOrEqual(5);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it("should chunk by fixed-size word window strategy", () => {
    const words = Array.from({ length: 50 }, (_, i) => `token${i + 1}`);
    const text = words.join(" ");

    const chunks = chunkText(text, {
      strategy: "fixed-size",
      targetChunkWords: 20,
      overlapWords: 5,
    });

    expect(chunks.length).toBe(3);
    expect(chunks[0].wordCount).toBe(20);
    expect(chunks[0].text.startsWith("token1")).toBe(true);
    expect(chunks[0].text.endsWith("token20")).toBe(true);

    // Second chunk should start at offset 15 (20 - 5)
    expect(chunks[1].text.startsWith("token16")).toBe(true);
    expect(chunks[1].text.endsWith("token35")).toBe(true);

    // Third chunk
    expect(chunks[2].text.startsWith("token31")).toBe(true);
    expect(chunks[2].text.endsWith("token50")).toBe(true);
  });

  it("should truncate preview to 80 characters with ellipsis if long", () => {
    const longText =
      "This is an exceptionally lengthy sentence crafted specifically to exceed the eighty character preview threshold limit in text chunking.";
    const chunks = chunkText(longText, {
      targetChunkWords: 50,
      minChunkWords: 5,
    });

    expect(chunks.length).toBe(1);
    expect(chunks[0].preview.length).toBeLessThanOrEqual(83); // 80 chars + "..."
    expect(chunks[0].preview.endsWith("...")).toBe(true);
  });
});
