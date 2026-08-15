import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure pdfjs worker if available
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
} catch {
  // Ignore in test or worker-less environments
}

export interface ParsedDocument {
  name: string;
  type: string;
  size: number;
  text: string;
  pageCount?: number;
}

export const extractTextFromPdf = async (
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; pageCount: number }> => {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    if (pageText.trim()) {
      pageTexts.push(`--- Page ${i} ---\n${pageText.trim()}`);
    }
  }

  return {
    text: pageTexts.join("\n\n"),
    pageCount: numPages,
  };
};

export const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseFileContent = async (file: File): Promise<ParsedDocument> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf" || file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const { text, pageCount } = await extractTextFromPdf(arrayBuffer);
    return {
      name: file.name,
      type: "pdf",
      size: file.size,
      text: text.trim() || "No extractable text found in this PDF document.",
      pageCount,
    };
  }

  if (
    extension === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromDocx(arrayBuffer);
    return {
      name: file.name,
      type: "docx",
      size: file.size,
      text: text.trim() || "No text found in Word document.",
    };
  }

  // Plain text, Markdown, JSON, CSV, TSV
  const text = await file.text();
  return {
    name: file.name,
    type: extension || "txt",
    size: file.size,
    text: text.trim(),
  };
};
