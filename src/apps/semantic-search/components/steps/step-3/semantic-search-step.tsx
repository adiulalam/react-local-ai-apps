import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Sliders,
  ArrowRight,
  FileText,
  Target,
  ChevronRight,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H3, Muted, Small } from "@/components/ui/typography";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";
import { SAMPLE_DOCUMENTS } from "@/apps/semantic-search/utils/sample-documents";

export const SemanticSearchStep = () => {
  const { formData, setFormData, nextStep, highlightChunk } = useSemanticSearchContext();
  const { searchQuery, isSearching } = useEmbeddingContext();
  const [inputQuery, setInputQuery] = useState(formData.searchQuery || "");
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Find sample queries for this document if available
  const matchedSample = SAMPLE_DOCUMENTS.find(
    (s) => s.name === formData.documentName || s.text === formData.documentText
  );
  const sampleSuggestions = matchedSample?.sampleQueries || [
    "What are the main key points discussed?",
    "How does the core mechanism work?",
    "What conclusions or takeaways are highlighted?",
  ];

  // Perform search on mount if a query is present or prefilled
  useEffect(() => {
    if (formData.searchQuery && formData.searchResults.length === 0) {
      searchQuery(formData.searchQuery);
    }
  }, [formData.searchQuery, formData.searchResults.length, searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    searchQuery(inputQuery);
  };

  const handleSelectSuggestion = (query: string) => {
    setInputQuery(query);
    searchQuery(query);
  };

  const handleClearSearch = () => {
    setInputQuery("");
    setFormData((prev) => ({
      ...prev,
      searchQuery: "",
      searchResults: [],
      selectedChunkId: null,
    }));
  };

  const scrollToChunk = (chunkId: string) => {
    highlightChunk(chunkId);
    const element = chunkRefs.current[chunkId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleThresholdChange = (threshold: number) => {
    setFormData((prev) => ({ ...prev, similarityThreshold: threshold }));
    if (inputQuery.trim()) {
      searchQuery(inputQuery);
    }
  };

  const handleTopKChange = (topK: number) => {
    setFormData((prev) => ({ ...prev, topK }));
    if (inputQuery.trim()) {
      searchQuery(inputQuery);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <H3>Semantic Search & Document Highlighting</H3>
        <Muted>
          Search with natural language. The embedding engine calculates vector similarity across all
          chunks and instantly highlights relevant sections.
        </Muted>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question or enter a concept (e.g. 'How does WebGPU accelerate in-browser AI?')..."
              className="pl-9 text-sm"
            />
            {inputQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0"
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSearching || !inputQuery.trim()}
            className="shrink-0 gap-2"
          >
            {isSearching ? (
              <Sparkles className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span>{isSearching ? "Searching..." : "Search"}</span>
          </Button>
        </div>

        {/* Query Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Small className="text-muted-foreground mr-1 text-xs font-medium">Suggestions:</Small>
          {sampleSuggestions.map((query) => (
            <Button
              key={query}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectSuggestion(query)}
              className="h-7 rounded-full border-dashed text-xs"
            >
              <Sparkles className="text-primary mr-1 size-3" />
              <span className="max-w-xs truncate">{query}</span>
            </Button>
          ))}
        </div>
      </form>

      {/* Split View: Left Document Reader & Right Ranked Matches */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Document Reader (7 cols) */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-primary size-4" />
              <Small className="font-semibold">Interactive Document Viewer</Small>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              {formData.chunks.length} total paragraphs
            </Badge>
          </div>

          <div className="border-border/70 bg-card max-h-[550px] space-y-4 overflow-y-auto rounded-xl border p-4 shadow-inner">
            {formData.chunks.map((chunk) => {
              const match = formData.searchResults.find((m) => m.chunk.id === chunk.id);
              const isSelected = formData.selectedChunkId === chunk.id;
              const isMatch = Boolean(match);

              let matchBg = "bg-secondary/20 border-border/50";
              if (isMatch) {
                matchBg =
                  match!.score > 0.6
                    ? "bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/30"
                    : "bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30";
              }
              if (isSelected) {
                matchBg += " ring-2 ring-primary border-primary shadow-md";
              }

              return (
                <div
                  key={chunk.id}
                  ref={(el) => {
                    chunkRefs.current[chunk.id] = el;
                  }}
                  onClick={() => highlightChunk(chunk.id)}
                  className={`relative cursor-pointer rounded-lg border p-3.5 transition-all ${matchBg}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Chunk #{chunk.index + 1}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {chunk.wordCount} words
                      </span>
                    </div>

                    {isMatch && (
                      <Badge
                        variant={match!.score > 0.6 ? "default" : "secondary"}
                        className="gap-1 text-[11px] font-semibold"
                      >
                        <Target className="size-3" />
                        <span>{match!.percentage}% Semantic Match</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-foreground font-sans text-xs leading-relaxed whitespace-pre-line">
                    {chunk.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ranked Matches & Search Controls (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Controls Card */}
          <Card className="bg-card border-border/70">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Retrieval Tuning
                </CardTitle>
                <Sliders className="text-muted-foreground size-3.5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <Small className="text-[11px] font-medium">Top Matches (Top-K)</Small>
                  <Badge variant="secondary" className="text-[10px]">
                    {formData.topK}
                  </Badge>
                </div>
                <Slider
                  value={[formData.topK]}
                  min={1}
                  max={8}
                  step={1}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : (val as number);
                    handleTopKChange(v);
                  }}
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <Small className="text-[11px] font-medium">Min Similarity Threshold</Small>
                  <Badge variant="secondary" className="text-[10px]">
                    {Math.round(formData.similarityThreshold * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[formData.similarityThreshold * 100]}
                  min={10}
                  max={70}
                  step={5}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : (val as number);
                    handleThresholdChange(v / 100);
                  }}
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ranked Matches List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Small className="text-xs font-semibold">
                Ranked Semantic Matches ({formData.searchResults.length})
              </Small>
              {formData.searchResults.length > 0 && (
                <Small className="text-muted-foreground text-[11px]">
                  Click to jump in document
                </Small>
              )}
            </div>

            {formData.searchResults.length === 0 ? (
              <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                <Search className="text-muted-foreground mb-2 size-8 opacity-40" />
                <p className="text-muted-foreground text-xs">
                  {inputQuery.trim()
                    ? "No passages matched the current similarity threshold. Try lowering the threshold or adjusting the query."
                    : "Enter a question or select a suggestion above to view semantic matches."}
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                {formData.searchResults.map((match) => {
                  const isSelected = formData.selectedChunkId === match.chunk.id;
                  return (
                    <Card
                      key={match.chunk.id}
                      onClick={() => scrollToChunk(match.chunk.id)}
                      className={`hover:border-primary/60 cursor-pointer transition-all hover:shadow-xs ${
                        isSelected ? "border-primary bg-primary/5 ring-primary ring-1" : "bg-card"
                      }`}
                    >
                      <CardContent className="space-y-2 p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[11px] font-bold">
                              #{match.rank}
                            </Badge>
                            <Small className="text-xs font-semibold">
                              Chunk #{match.chunk.index + 1}
                            </Small>
                          </div>
                          <Badge
                            variant={match.score > 0.6 ? "default" : "secondary"}
                            className="font-mono text-[11px]"
                          >
                            {match.percentage}% Match
                          </Badge>
                        </div>

                        <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                          {match.chunk.text}
                        </p>

                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary h-6 p-0 text-[11px] hover:bg-transparent"
                          >
                            <span>Jump to chunk</span>
                            <ChevronRight className="ml-1 size-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Proceed to RAG Chat Button */}
          <div className="pt-2">
            <Button onClick={nextStep} className="w-full gap-2" size="lg">
              <MessageSquare className="size-4" />
              <span>Ask AI About Document (RAG Chat)</span>
              <ArrowRight className="ml-auto size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
