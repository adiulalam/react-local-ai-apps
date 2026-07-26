import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ProgressInfo {
  status: string;
  name: string;
  file: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

interface DownloadProgressProps {
  progressItems: Record<string, ProgressInfo>;
}

export const DownloadProgress = ({ progressItems }: DownloadProgressProps) => {
  const files = Object.values(progressItems);
  if (files.length === 0) return null;

  // We keep all files visible. "done" files will naturally show 100%.
  // The progress component is entirely unmounted when status becomes "processing" anyway.
  const activeDownloads = files;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Downloading AI Model</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[30vh] space-y-3 overflow-y-auto">
        {activeDownloads.map((data, idx) => (
          <div key={`${data.file}-${idx}`} className="space-y-1">
            <div className="text-muted-foreground flex justify-between text-xs">
              <span className="max-w-3/4 truncate" title={data.file}>
                {data.file}
              </span>
              <span>{data.status === "done" ? 100 : Math.round(data.progress || 0)}%</span>
            </div>
            <Progress value={data.status === "done" ? 100 : data.progress || 0} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
