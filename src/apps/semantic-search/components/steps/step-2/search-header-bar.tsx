import { Search, Sparkles, Download, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { H4, Muted, Small } from "@/components/ui/typography";

interface SearchHeaderBarProps {
  documentName: string;
  chunksCount: number;
  hasMessages: boolean;
  inputQuery: string;
  isGenerating: boolean;
  isSearching: boolean;
  promptSuggestions: string[];
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectSuggestion: (query: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export const SearchHeaderBar = ({
  documentName,
  chunksCount,
  hasMessages,
  inputQuery,
  isGenerating,
  isSearching,
  promptSuggestions,
  onInputChange,
  onSubmit,
  onSelectSuggestion,
  onExport,
  onClear,
}: SearchHeaderBarProps) => {
  return (
    <div className="space-y-4">
      {/* Document Header Bar */}
      <div className="bg-secondary/30 border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <FileText className="size-4" />
          </div>
          <div>
            <H4 className="text-sm font-semibold">{documentName || "Document"}</H4>
            <Muted className="text-xs">
              {chunksCount} sections indexed • Ready for search & Q&A
            </Muted>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <>
              <Button variant="outline" size="sm" onClick={onExport} className="h-8 gap-1 text-xs">
                <Download className="size-3.5" />
                <span>Export Report</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground h-8 text-xs"
              >
                <RotateCcw className="mr-1 size-3.5" />
                <span>Clear</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Search & Question Bar */}
      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={inputQuery}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask anything or search passages (e.g. 'What are the main key points?')..."
              className="pl-9 text-sm"
              disabled={isGenerating}
            />
          </div>
          <Button
            type="submit"
            disabled={isGenerating || isSearching || !inputQuery.trim()}
            className="shrink-0 gap-1.5 px-4"
          >
            {isGenerating || isSearching ? (
              <Sparkles className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span>Ask AI</span>
          </Button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Small className="text-muted-foreground mr-1 text-[11px] font-medium">Try asking:</Small>
          {promptSuggestions.map((query) => (
            <Button
              key={query}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectSuggestion(query)}
              disabled={isGenerating}
              className="h-6 rounded-full border-dashed px-2.5 text-[11px]"
            >
              <Sparkles className="text-primary mr-1 size-2.5" />
              <span className="max-w-xs truncate">{query}</span>
            </Button>
          ))}
        </div>
      </form>
    </div>
  );
};
