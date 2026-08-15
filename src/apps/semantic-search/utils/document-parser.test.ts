import { describe, it, expect, vi } from "vitest";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { extractTextFromPdf, extractTextFromDocx, parseFileContent } from "./document-parser";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn().mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockImplementation((pageNum: number) =>
        Promise.resolve({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: `Page ${pageNum} Title` }, { str: `Page ${pageNum} Content line.` }],
          }),
        })
      ),
    }),
  })),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: "Extracted raw Word document text contents.",
    }),
  },
}));

describe("document-parser", () => {
  describe("extractTextFromPdf", () => {
    it("should extract text page by page from PDF array buffer", async () => {
      const buffer = new ArrayBuffer(8);
      const result = await extractTextFromPdf(buffer);

      expect(pdfjsLib.getDocument).toHaveBeenCalled();
      expect(result.pageCount).toBe(2);
      expect(result.text).toContain("--- Page 1 ---");
      expect(result.text).toContain("Page 1 Title Page 1 Content line.");
      expect(result.text).toContain("--- Page 2 ---");
      expect(result.text).toContain("Page 2 Title Page 2 Content line.");
    });
  });

  describe("extractTextFromDocx", () => {
    it("should extract text from Word array buffer using mammoth", async () => {
      const buffer = new ArrayBuffer(8);
      const text = await extractTextFromDocx(buffer);

      expect(mammoth.extractRawText).toHaveBeenCalledWith({ arrayBuffer: buffer });
      expect(text).toBe("Extracted raw Word document text contents.");
    });
  });

  describe("parseFileContent", () => {
    it("should parse PDF file correctly", async () => {
      const file = new File(["dummy pdf binary"], "research-paper.pdf", {
        type: "application/pdf",
      });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("research-paper.pdf");
      expect(parsed.type).toBe("pdf");
      expect(parsed.pageCount).toBe(2);
      expect(parsed.text).toContain("--- Page 1 ---");
    });

    it("should parse Word (.docx) file correctly", async () => {
      const file = new File(["dummy docx binary"], "annual-report.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("annual-report.docx");
      expect(parsed.type).toBe("docx");
      expect(parsed.text).toBe("Extracted raw Word document text contents.");
    });

    it("should parse plain text (.txt) file correctly", async () => {
      const textContent = "Simple plain text document notes.";
      const file = new File([textContent], "notes.txt", { type: "text/plain" });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("notes.txt");
      expect(parsed.type).toBe("txt");
      expect(parsed.text).toBe(textContent);
      expect(parsed.size).toBe(textContent.length);
    });

    it("should parse Markdown (.md) file correctly", async () => {
      const mdContent = "# Markdown Heading\n\n- Point 1\n- Point 2";
      const file = new File([mdContent], "README.md", { type: "text/markdown" });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("README.md");
      expect(parsed.type).toBe("md");
      expect(parsed.text).toBe(mdContent);
    });

    it("should parse CSV (.csv) file correctly", async () => {
      const csvContent = "col1,col2,col3\nval1,val2,val3";
      const file = new File([csvContent], "data.csv", { type: "text/csv" });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("data.csv");
      expect(parsed.type).toBe("csv");
      expect(parsed.text).toBe(csvContent);
    });

    it("should parse JSON (.json) file correctly", async () => {
      const jsonContent = JSON.stringify({ key: "value", number: 42 });
      const file = new File([jsonContent], "config.json", { type: "application/json" });

      const parsed = await parseFileContent(file);

      expect(parsed.name).toBe("config.json");
      expect(parsed.type).toBe("json");
      expect(parsed.text).toBe(jsonContent);
    });
  });
});
