import { useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { H3, H4, Muted, Small } from "@/components/ui/typography";
import { DownloadProgress } from "@/components/ui/download-progress";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { useEmbeddingContext } from "@/apps/semantic-search/context/embedding-context";

export const VectorIndexingStep = () => {
  const { formData, nextStep } = useSemanticSearchContext();
  const { status, progressItems, indexingProgress, error, startEmbedding } = useEmbeddingContext();

  const isIndexed =
    formData.chunkEmbeddings.length > 0 &&
    formData.chunkEmbeddings.length === formData.chunks.length;
  const isRunning = status === "loading" || status === "indexing";

  useEffect(() => {
    // Auto-start embedding if chunks exist and haven't been embedded yet
    if (formData.chunks.length > 0 && formData.chunkEmbeddings.length === 0 && status === "idle") {
      startEmbedding(formData.chunks);
    }
  }, [formData.chunks, formData.chunkEmbeddings.length, status, startEmbedding]);

  const handleStartIndexing = () => {
    if (formData.chunks.length > 0) {
      startEmbedding(formData.chunks);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <H3>Vector Indexing & Embedding</H3>
        <Muted>
          Convert your document chunks into dense 384-dimensional semantic vectors using the
          in-browser Transformers.js feature extraction pipeline.
        </Muted>
      </div>

      {/* Model Spec Card */}
      <Card className="bg-card border-border/70">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
                <Cpu className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Embedding Model</CardTitle>
                <CardDescription className="text-xs">Xenova/all-MiniLM-L6-v2</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Zap className="size-3 text-amber-500" />
                <span>WebGPU / WASM</span>
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                384-Dim Vectors
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>100% Offline</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <Muted className="text-xs">
            This compact ~23MB model computes high-precision semantic representations directly
            inside your browser memory. Cosine similarity between generated vectors allows
            instantaneous sub-millisecond passage retrieval.
          </Muted>
        </CardContent>
      </Card>

      {/* Loading Model Weights */}
      {status === "loading" && Object.keys(progressItems).length > 0 && (
        <div className="bg-secondary/30 border-border/60 rounded-xl border p-4">
          <DownloadProgress progressItems={progressItems} />
        </div>
      )}

      {/* Indexing Progress */}
      {status === "indexing" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary size-4 animate-spin" />
                <span>Embedding Document Chunks...</span>
              </div>
              <span className="font-mono text-xs">
                {indexingProgress.current} of {indexingProgress.total} (
                {indexingProgress.percentage}%)
              </span>
            </div>
            <Progress value={indexingProgress.percentage} className="h-2" />
            <Muted className="text-xs">
              Calculating 384-dimensional vector embeddings for chunk #{indexingProgress.current}...
            </Muted>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleStartIndexing}>
            Retry
          </Button>
        </div>
      )}

      {/* Completed State */}
      {isIndexed && (
        <div className="space-y-5">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <H4 className="text-sm font-semibold">Document Vector Index Ready</H4>
                  <Muted className="text-xs">
                    Successfully generated and indexed {formData.chunkEmbeddings.length} vectors in
                    local memory.
                  </Muted>
                </div>
              </div>

              <Button onClick={nextStep} className="gap-2">
                <span>Proceed to Semantic Search</span>
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Vector Registry Table Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Small className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Local Vector Registry ({formData.chunks.length} Entries)
              </Small>
              <Badge variant="secondary" className="text-[10px]">
                Float32Array • 384 dims / chunk
              </Badge>
            </div>

            <div className="border-border/60 bg-card max-h-72 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground sticky top-0 border-b">
                  <tr>
                    <th className="p-2.5 font-medium">#</th>
                    <th className="p-2.5 font-medium">Chunk Text Snippet</th>
                    <th className="p-2.5 font-medium">Words</th>
                    <th className="p-2.5 font-medium">Vector Dimensions</th>
                    <th className="p-2.5 font-medium">Vector Sample</th>
                  </tr>
                </thead>
                <tbody className="divide-border/40 divide-y font-mono text-[11px]">
                  {formData.chunks.map((chunk, idx) => {
                    const vec = formData.chunkEmbeddings[idx];
                    const sample = vec
                      ? `[${Array.from(vec.slice(0, 3))
                          .map((n) => n.toFixed(3))
                          .join(", ")}, ...]`
                      : "Pending";

                    return (
                      <tr key={chunk.id} className="hover:bg-muted/30">
                        <td className="text-muted-foreground p-2.5 font-sans font-medium">
                          {idx + 1}
                        </td>
                        <td className="text-foreground max-w-xs truncate p-2.5 font-sans">
                          {chunk.text.slice(0, 75)}...
                        </td>
                        <td className="text-muted-foreground p-2.5">{chunk.wordCount}</td>
                        <td className="text-muted-foreground p-2.5">384-dim</td>
                        <td className="text-primary p-2.5 text-[10px]">{sample}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Trigger if idle */}
      {!isIndexed && !isRunning && !error && (
        <div className="flex justify-center pt-2">
          <Button onClick={handleStartIndexing} className="gap-2" size="lg">
            <Sparkles className="size-4" />
            <span>Start Vector Indexing</span>
          </Button>
        </div>
      )}
    </div>
  );
};
