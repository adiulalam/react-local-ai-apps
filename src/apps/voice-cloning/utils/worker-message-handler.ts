import type { ProgressInfo } from "@/components/ui/download-progress";

export type WorkerStatus =
  | "idle"
  | "initializing"
  | "loading"
  | "encoding"
  | "generating"
  | "complete"
  | "error";

export interface WorkerCallbacks {
  setStatus: (status: WorkerStatus) => void;
  setProgressItems: (
    updater: (prev: Record<string, ProgressInfo>) => Record<string, ProgressInfo>
  ) => void;
  setStatusText: (text: string) => void;
  setProgressPercent: (percent: number) => void;
  onReady: () => void;
  onSpeakerEncoded: () => void;
  onComplete: (audioData: Float32Array, samplingRate: number) => void;
  setErrorMsg: (msg: string) => void;
}

export const createWorkerMessageHandler = (callbacks: WorkerCallbacks) => {
  return (e: MessageEvent) => {
    const msg = e.data || {};

    switch (msg.type) {
      case "load:progress":
        if (msg.data?.file) {
          callbacks.setStatus("loading");
          callbacks.setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
        }
        break;
      case "load:complete":
        callbacks.setProgressItems(() => ({}));
        callbacks.setStatus("encoding");
        callbacks.setStatusText("Encoding reference voice...");
        callbacks.onReady();
        break;
      case "encode_speaker:complete":
        callbacks.setStatus("generating");
        callbacks.setStatusText("Generating speech...");
        callbacks.setProgressPercent(0);
        callbacks.onSpeakerEncoded();
        break;
      case "generate:complete": {
        callbacks.setStatus("complete");
        callbacks.setProgressItems(() => ({}));
        callbacks.setProgressPercent(100);
        const waveformBuffer = msg.data?.waveform as ArrayBuffer;
        const audioData = new Float32Array(waveformBuffer);
        callbacks.onComplete(audioData, 24000);
        break;
      }
      case "error":
        callbacks.setStatus("error");
        callbacks.setProgressItems(() => ({}));
        callbacks.setErrorMsg(
          msg.data?.message || "An error occurred during voice cloning"
        );
        break;
    }
  };
};
