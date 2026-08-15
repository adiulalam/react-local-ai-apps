export interface DocumentChunk {
  id: string;
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  wordCount: number;
  preview: string;
}

export interface ChunkingOptions {
  strategy?: "paragraph" | "fixed-size";
  targetChunkWords?: number; // target words per chunk (default 120)
  overlapWords?: number; // overlap words between chunks (default 20)
  minChunkWords?: number; // minimum words to form a valid chunk (default 15)
}

export const chunkText = (text: string, options: ChunkingOptions = {}): DocumentChunk[] => {
  const {
    strategy = "paragraph",
    targetChunkWords = 120,
    overlapWords = 20,
    minChunkWords = 10,
  } = options;

  const cleanText = text.replace(/\r\n/g, "\n").trim();
  if (!cleanText) return [];

  const chunks: DocumentChunk[] = [];

  if (strategy === "paragraph") {
    // Split by double newlines or section headers
    const rawParagraphs = cleanText.split(/\n{2,}/);
    let currentChunkWords: string[] = [];
    let currentChunkStart = 0;

    for (let i = 0; i < rawParagraphs.length; i++) {
      const paragraph = rawParagraphs[i].trim();
      if (!paragraph) continue;

      const words = paragraph.split(/\s+/).filter(Boolean);

      // If a single paragraph is larger than targetChunkWords * 1.5, subdivide it into sentence windows
      if (words.length > targetChunkWords * 1.8) {
        // Flush previous chunk if any
        if (currentChunkWords.length > 0) {
          const chunkStr = currentChunkWords.join(" ");
          const charStart = cleanText.indexOf(chunkStr, currentChunkStart);
          const actualStart = charStart !== -1 ? charStart : currentChunkStart;
          chunks.push({
            id: `chunk-${chunks.length + 1}`,
            index: chunks.length,
            text: chunkStr,
            charStart: actualStart,
            charEnd: actualStart + chunkStr.length,
            wordCount: currentChunkWords.length,
            preview:
              chunkStr.slice(0, 80).replace(/\n/g, " ") + (chunkStr.length > 80 ? "..." : ""),
          });
          currentChunkWords = [];
        }

        // Subdivide large paragraph
        const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [paragraph];
        let subWords: string[] = [];
        for (const sentence of sentences) {
          const sWords = sentence.trim().split(/\s+/).filter(Boolean);
          if (
            subWords.length + sWords.length > targetChunkWords &&
            subWords.length >= minChunkWords
          ) {
            const subStr = subWords.join(" ");
            const charStart = cleanText.indexOf(subStr, currentChunkStart);
            const actualStart = charStart !== -1 ? charStart : currentChunkStart;
            chunks.push({
              id: `chunk-${chunks.length + 1}`,
              index: chunks.length,
              text: subStr,
              charStart: actualStart,
              charEnd: actualStart + subStr.length,
              wordCount: subWords.length,
              preview: subStr.slice(0, 80).replace(/\n/g, " ") + (subStr.length > 80 ? "..." : ""),
            });
            // Keep overlap
            const overlap = subWords.slice(Math.max(0, subWords.length - overlapWords));
            subWords = [...overlap, ...sWords];
          } else {
            subWords.push(...sWords);
          }
        }
        if (subWords.length >= minChunkWords) {
          const subStr = subWords.join(" ");
          const charStart = cleanText.indexOf(subStr, currentChunkStart);
          const actualStart = charStart !== -1 ? charStart : currentChunkStart;
          chunks.push({
            id: `chunk-${chunks.length + 1}`,
            index: chunks.length,
            text: subStr,
            charStart: actualStart,
            charEnd: actualStart + subStr.length,
            wordCount: subWords.length,
            preview: subStr.slice(0, 80).replace(/\n/g, " ") + (subStr.length > 80 ? "..." : ""),
          });
        }
        continue;
      }

      // Group smaller paragraphs together until targetChunkWords is reached
      if (
        currentChunkWords.length + words.length > targetChunkWords &&
        currentChunkWords.length >= minChunkWords
      ) {
        const chunkStr = currentChunkWords.join(" ");
        const charStart = cleanText.indexOf(chunkStr, currentChunkStart);
        const actualStart = charStart !== -1 ? charStart : currentChunkStart;
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          index: chunks.length,
          text: chunkStr,
          charStart: actualStart,
          charEnd: actualStart + chunkStr.length,
          wordCount: currentChunkWords.length,
          preview: chunkStr.slice(0, 80).replace(/\n/g, " ") + (chunkStr.length > 80 ? "..." : ""),
        });

        // Overlap words
        const overlap = currentChunkWords.slice(
          Math.max(0, currentChunkWords.length - overlapWords)
        );
        currentChunkWords = [...overlap, ...words];
        currentChunkStart = actualStart + chunkStr.length;
      } else {
        currentChunkWords.push(...words);
      }
    }

    if (currentChunkWords.length > 0) {
      const chunkStr = currentChunkWords.join(" ");
      const charStart = cleanText.indexOf(chunkStr, currentChunkStart);
      const actualStart = charStart !== -1 ? charStart : currentChunkStart;
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        index: chunks.length,
        text: chunkStr,
        charStart: actualStart,
        charEnd: actualStart + chunkStr.length,
        wordCount: currentChunkWords.length,
        preview: chunkStr.slice(0, 80).replace(/\n/g, " ") + (chunkStr.length > 80 ? "..." : ""),
      });
    }
  } else {
    // Fixed-size word window chunking
    const allWords = cleanText.split(/\s+/).filter(Boolean);
    let startIdx = 0;

    while (startIdx < allWords.length) {
      const endIdx = Math.min(startIdx + targetChunkWords, allWords.length);
      const chunkWords = allWords.slice(startIdx, endIdx);
      const chunkStr = chunkWords.join(" ");

      const charStart = cleanText.indexOf(chunkStr);
      const actualStart = charStart !== -1 ? charStart : 0;

      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        index: chunks.length,
        text: chunkStr,
        charStart: actualStart,
        charEnd: actualStart + chunkStr.length,
        wordCount: chunkWords.length,
        preview: chunkStr.slice(0, 80).replace(/\n/g, " ") + (chunkStr.length > 80 ? "..." : ""),
      });

      if (endIdx >= allWords.length) break;
      startIdx += Math.max(1, targetChunkWords - overlapWords);
    }
  }

  return chunks;
};
