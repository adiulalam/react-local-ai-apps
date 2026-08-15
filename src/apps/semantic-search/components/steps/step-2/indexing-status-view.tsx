import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { H3, Muted } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import type { WorkerStatus } from "@/apps/semantic-search/utils/worker-message-handler";

interface IndexingStatusViewProps {
  embedStatus: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  indexingProgress: { current: number; total: number; percentage: number };
  chunksCount: number;
  embedError: string;
  onRetry: () => void;
}

export const IndexingStatusView = ({
  embedStatus,
  progressItems,
  indexingProgress,
  chunksCount,
  embedError,
  onRetry,
}: IndexingStatusViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <H3>Preparing Offline AI & Indexing Document</H3>
        <Muted>
          Analyzing text and creating vector embeddings directly in your browser memory.
        </Muted>
      </div>

      {embedStatus === "loading" && Object.keys(progressItems).length > 0 && (
        <div className="bg-secondary/30 border-border/60 rounded-xl border p-4">
          <DownloadProgress progressItems={progressItems} />
        </div>
      )}

      {embedStatus === "indexing" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <Spinner className="text-primary size-4" />
                <span>Indexing {chunksCount} document sections...</span>
              </div>
              <span className="font-mono text-xs">{indexingProgress.percentage}%</span>
            </div>
            <Progress value={indexingProgress.percentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {embedError && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm">
          <span>{embedError}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
