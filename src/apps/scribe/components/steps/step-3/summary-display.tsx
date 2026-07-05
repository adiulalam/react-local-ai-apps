import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SummaryDisplayProps {
  status: "idle" | "initializing" | "loading" | "processing" | "complete" | "error";
  summary: string;
  onSummaryChange: (val: string) => void;
  errorMsg: string;
  onContinue: () => void;
}

export const SummaryDisplay = ({
  status,
  summary,
  onSummaryChange,
  errorMsg,
  onContinue,
}: SummaryDisplayProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [summary]);

  if (status === "idle") return null;

  return (
    <div className="mt-4 space-y-6">
      {status === "initializing" && (
        <p className="text-muted-foreground text-sm">Initializing Summarization Worker...</p>
      )}

      {status === "loading" && (
        <p className="text-muted-foreground text-sm">
          Downloading or loading DistilBART summary model chunks...
        </p>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">Summarizing text locally...</p>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {(status === "processing" || status === "complete") && (
        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            rows={8}
            className="max-h-52 w-full resize-y text-base"
            placeholder={
              status === "processing"
                ? "Summarizing... Text will appear here."
                : "Summarization complete! You can now proceed."
            }
          />
          <div className="flex justify-end">
            <Button onClick={onContinue} disabled={status !== "complete"}>
              Continue to Export
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
