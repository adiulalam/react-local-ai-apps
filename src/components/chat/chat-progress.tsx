import { Progress } from "@/components/ui/progress";
import { Muted } from "@/components/ui/typography";

export interface ProgressItem {
  file: string;
  progress: number;
  total?: number;
}

export interface ChatProgressProps {
  message?: string;
  items: ProgressItem[];
}

export const ChatProgress = ({ message, items }: ChatProgressProps) => {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      {message && <Muted className="text-center">{message}</Muted>}
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <Muted className="max-w-[80%] truncate text-xs">{item.file}</Muted>
            <Muted className="text-xs">{Math.round(item.progress)}%</Muted>
          </div>
          <Progress value={item.progress} className="h-2" />
        </div>
      ))}
    </div>
  );
};
