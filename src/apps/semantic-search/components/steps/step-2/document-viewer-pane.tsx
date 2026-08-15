import { type RefObject } from "react";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { P, Small } from "@/components/ui/typography";
import type { DocumentChunk } from "@/apps/semantic-search/utils/text-chunker";
import type { SearchMatch } from "@/apps/semantic-search/utils/similarity";

interface DocumentViewerPaneProps {
  chunks: DocumentChunk[];
  searchResults: SearchMatch[];
  selectedChunkId: string | null;
  chunkRefs: RefObject<Record<string, HTMLDivElement | null>>;
  onChunkClick: (chunkId: string) => void;
}

export const DocumentViewerPane = ({
  chunks,
  searchResults,
  selectedChunkId,
  chunkRefs,
  onChunkClick,
}: DocumentViewerPaneProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Small className="text-xs font-semibold">Document Text & Live Highlights</Small>
        <Badge variant="secondary" className="text-[10px]">
          {chunks.length} sections
        </Badge>
      </div>

      <div className="border-border/70 bg-card max-h-[680px] min-h-[520px] space-y-3.5 overflow-y-auto rounded-xl border p-4 shadow-inner">
        {chunks.map((chunk) => {
          const match = searchResults.find((m) => m.chunk.id === chunk.id);
          const isSelected = selectedChunkId === chunk.id;
          const isMatch = Boolean(match);

          let matchBg = "bg-secondary/20 border-border/50";
          if (isMatch) {
            matchBg =
              match!.score > 0.6
                ? "bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/30"
                : "bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30";
          }
          if (isSelected) {
            matchBg += " ring-2 ring-primary border-primary shadow-xs";
          }

          return (
            <div
              key={chunk.id}
              ref={(el) => {
                if (chunkRefs.current) {
                  chunkRefs.current[chunk.id] = el;
                }
              }}
              onClick={() => onChunkClick(chunk.id)}
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${matchBg}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-[10px]">
                  Chunk #{chunk.index + 1}
                </Badge>

                {isMatch && (
                  <Badge
                    variant={match!.score > 0.6 ? "default" : "secondary"}
                    className="gap-1 text-[10px] font-semibold"
                  >
                    <Target className="size-2.5" />
                    <span>{match!.percentage}% Match</span>
                  </Badge>
                )}
              </div>

              <P className="text-foreground font-sans text-xs leading-relaxed whitespace-pre-line not-first:mt-0 sm:text-sm">
                {chunk.text}
              </P>
            </div>
          );
        })}
      </div>
    </div>
  );
};
