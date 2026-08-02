import { Loader2, MicVocal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Muted, Small } from "@/components/ui/typography";

type GenerationProgressProps = {
  isGenerating: boolean;
  statusText: string;
  progressPercent: number;
};

export const GenerationProgress = ({
  isGenerating,
  statusText,
  progressPercent,
}: GenerationProgressProps) => {
  if (!isGenerating) {
    return null;
  }

  const text = statusText || `Cloning & generating (${progressPercent}%)...`;

  return (
    <div className="border-primary/20 bg-primary/5 animate-in fade-in space-y-3 rounded-lg border p-4 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="text-primary size-4 animate-spin" />
          <Small className="text-primary flex items-center gap-1.5 text-xs font-medium">
            <MicVocal className="size-3.5" />
            {text}
          </Small>
        </div>
        <Small className="text-primary font-mono text-xs font-semibold">
          {Math.round(progressPercent)}%
        </Small>
      </div>

      <Progress value={progressPercent} className="h-2.5 transition-all duration-300" />

      <Muted className="block text-[11px]">
        Chatterbox TTS model inference runs locally using WebGPU / WebAssembly in your browser.
      </Muted>
    </div>
  );
};
