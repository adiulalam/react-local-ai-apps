import { type ProgressInfo } from "@/components/ui/download-progress";

export type WorkerStatus =
  | "idle"
  | "initializing"
  | "loading"
  | "processing"
  | "complete"
  | "error";

export interface CaptionChunk {
  timestamp: [number, number];
  text: string;
}

export interface WorkerCallbacks<T> {
  setStatus: (status: WorkerStatus) => void;
  setProgressItems: (
    updater: (prev: Record<string, ProgressInfo>) => Record<string, ProgressInfo>
  ) => void;
  onReady: () => void;
  onProgress?: (progressData: { statusText: string; progress: number }) => void;
  onComplete: (result: T) => void;
  setErrorMsg: (msg: string) => void;
}

export const createWorkerMessageHandler = <T = CaptionChunk[]>(callbacks: WorkerCallbacks<T>) => {
  return (e: MessageEvent) => {
    const msg = e.data;

    switch (msg.type) {
      case "progress":
        callbacks.setStatus("loading");
        callbacks.setProgressItems((prev) => ({ ...prev, [msg.data.file]: msg.data }));
        break;
      case "ready":
        callbacks.setProgressItems(() => ({}));
        callbacks.onReady();
        break;
      case "processing":
        callbacks.setStatus("processing");
        break;
      case "generating_progress":
        callbacks.setStatus("processing");
        if (callbacks.onProgress) {
          callbacks.onProgress({ statusText: msg.statusText, progress: msg.progress });
        }
        break;
      case "complete":
        callbacks.setStatus("complete");
        callbacks.onComplete(msg.result);
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setErrorMsg(msg.error);
        break;
    }
  };
};
