import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DownloadProgress, type ProgressInfo } from "@/components/ui/download-progress";
import { Muted } from "@/components/ui/typography";
import { createWorkerMessageHandler, type WorkerStatus } from "@/apps/scribe/utils/worker-message-handler";

interface TranscriptionStepProps {
  audioData: Float32Array;
  onNext: (transcription: string) => void;
}

export const TranscriptionStep = ({ audioData, onNext }: TranscriptionStepProps) => {
  const [transcription, setTranscription] = useState("");
  const [status, setStatus] = useState<WorkerStatus>("initializing");
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
        new URL("../../../../../lib/workers/whisper.worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      const messageHandler = createWorkerMessageHandler({
        setStatus,
        setProgressItems,
        setResultText: setTranscription,
        onReady: () => {
          if (!transcriptionStarted.current) {
            transcriptionStarted.current = true;
            worker.current?.postMessage({ type: "process", audio: audioData });
          }
        },
        onComplete: (result) => setTranscription(result),
        setErrorMsg,
      });

      worker.current.addEventListener("message", messageHandler);

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
        <Muted>Initializing Web Worker...</Muted>
      )}

      {status === "loading" && (
        <Muted>
          Checking cache and downloading required model chunks...
        </Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Muted>
            Transcribing audio locally... This may take a moment.
          </Muted>
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
