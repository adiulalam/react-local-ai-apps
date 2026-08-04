import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DownloadProgress } from "@/components/ui/download-progress";
import { Muted } from "@/components/ui/typography";
import { useScribeFormContext } from "../../../context/scribe-context";
import { useWhisperContext } from "../../../context/whisper-context";

export const TranscriptionStep = () => {
  const { formData, setTranscription, nextStep } = useScribeFormContext();
  const { status, error: errorMsg, progressItems } = useWhisperContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcription = formData.transcription || "";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcription]);

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && (
        <Muted>Checking cache and downloading required model chunks...</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Muted>Transcribing audio locally... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <p className="text-destructive text-sm">{errorMsg}</p>}

      {(status === "processing" || status === "complete") && (
        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            rows={10}
            className="max-h-52 w-full resize-y text-base wrap-anywhere"
            placeholder={
              status === "processing"
                ? "Transcribing... Text will appear here."
                : "Review and edit the generated transcription..."
            }
          />
          <div className="flex justify-end">
            <Button onClick={nextStep} disabled={status !== "complete"}>
              Continue to Summarization
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
