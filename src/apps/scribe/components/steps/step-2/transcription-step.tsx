import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";

interface TranscriptionStepProps {
  audioData: Float32Array;
  onNext: (transcription: string) => void;
}

type TStatus = "initializing" | "loading" | "processing" | "complete" | "error";

export const TranscriptionStep = ({ audioData, onNext }: TranscriptionStepProps) => {
  const [transcription, setTranscription] = useState("");
  const [status, setStatus] = useState<TStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});

  const worker = useRef<Worker | null>(null);
  const transcriptionStarted = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcription]);

  useEffect(() => {
    if (!audioData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMsg("No audio data provided. Please ensure Step 1 completed successfully.");
      return;
    }

    if (!worker.current) {
      // Instantiate worker
      worker.current = new Worker(
        new URL("../../../lib/workers/whisper.worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.current.addEventListener("message", (e) => {
        const msg = e.data;

        switch (msg.type) {
          case "progress":
            setStatus("loading");
            setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
            break;
          case "ready":
            setProgressItems({}); // Clear download progress
            if (!transcriptionStarted.current) {
              transcriptionStarted.current = true;
              worker.current?.postMessage({ type: "process", audio: audioData });
            }
            break;
          case "processing":
            setStatus("processing");
            break;
          case "update":
            setTranscription((prev) => prev + msg.output);
            break;
          case "complete":
            setStatus("complete");
            setTranscription(msg.result);
            break;
          case "error":
            setStatus("error");
            setErrorMsg(msg.error);
            break;
        }
      });

      // Start the worker model load
      worker.current.postMessage({ type: "load" });
    }

    return () => {
      // Clean up the worker if the component completely unmounts
      worker.current?.terminate();
      worker.current = null;
    };
  }, [audioData]);

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && (
        <p className="text-muted-foreground text-sm">Initializing Web Worker...</p>
      )}

      {status === "loading" && (
        <p className="text-muted-foreground text-sm">
          Checking cache and downloading required model chunks...
        </p>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">
            Transcribing audio locally... This may take a moment.
          </p>
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
            className="max-h-52 w-full resize-y text-base"
            placeholder={
              status === "processing"
                ? "Transcribing... Text will appear here."
                : "Review and edit the generated transcription..."
            }
          />
          <div className="flex justify-end">
            <Button onClick={() => onNext(transcription)} disabled={status !== "complete"}>
              Continue to Summarization
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
