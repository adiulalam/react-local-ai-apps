import { type ProgressInfo } from "@/components/ui/download-progress";

export type WorkerStatus =
  | "idle"
  | "initializing"
  | "loading"
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
  onComplete: (audioData: Float32Array, samplingRate: number) => void;
  setErrorMsg: (msg: string) => void;
}

export const createWorkerMessageHandler = (callbacks: WorkerCallbacks) => {
  return (e: MessageEvent) => {
    const msg = e.data || {};

    switch (msg.type) {
      case "progress":
        if (msg.data?.file) {
          callbacks.setStatus("loading");
          callbacks.setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
        }
        break;
      case "ready":
        callbacks.setProgressItems(() => ({}));
        callbacks.onReady();
        break;
      case "generating":
        callbacks.setStatus("generating");
        callbacks.setProgressItems(() => ({}));
        callbacks.setStatusText(`Generating audio for: "${msg.text}"...`);
        callbacks.setProgressPercent(0);
        break;
      case "generating_progress":
        callbacks.setStatus("generating");
        callbacks.setStatusText(msg.statusText || `Generating (${msg.progress || 0}%)...`);
        if (typeof msg.progress === "number") {
          callbacks.setProgressPercent(msg.progress);
        }
        break;
      case "complete":
        callbacks.setStatus("complete");
        callbacks.setProgressItems(() => ({}));
        callbacks.setProgressPercent(100);
        callbacks.onComplete(msg.audioData, msg.samplingRate || 32000);
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setProgressItems(() => ({}));
        callbacks.setErrorMsg(msg.error || "An error occurred during generation");
        break;
    }
  };
};
