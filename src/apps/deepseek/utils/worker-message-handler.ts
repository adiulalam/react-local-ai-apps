import { type ProgressItem } from "@/components/chat";

export type WorkerStatus = "idle" | "loading" | "ready" | "processing" | "complete" | "error";

export interface WorkerCallbacks {
  setStatus: (status: WorkerStatus) => void;
  setLoadingMessage: (msg: string) => void;
  setProgressItems: (updater: (prev: ProgressItem[]) => ProgressItem[]) => void;
  onReady: () => void;
  onStart: () => void;
  onUpdate: (output: string, tps: number | undefined, numTokens: number, state: string) => void;
  onComplete: () => void;
  setErrorMsg: (msg: string) => void;
}

export const createWorkerMessageHandler = (callbacks: WorkerCallbacks) => {
  return (e: MessageEvent) => {
    const msg = e.data;

    switch (msg.type) {
      case "loading":
        callbacks.setStatus("loading");
        if (msg.data) {
          callbacks.setLoadingMessage(msg.data);
        }
        break;
      case "progress": {
        const d = msg.data;
        if (d.status === "initiate") {
          callbacks.setProgressItems((prev) => [...prev, d]);
        } else if (d.status === "progress") {
          callbacks.setProgressItems((prev) =>
            prev.map((item) => (item.file === d.file ? { ...item, ...d } : item))
          );
        } else if (d.status === "done") {
          callbacks.setProgressItems((prev) => prev.filter((item) => item.file !== d.file));
        }
        break;
      }
      case "ready":
        callbacks.setStatus("ready");
        callbacks.onReady();
        break;
      case "start":
        callbacks.setStatus("processing");
        callbacks.onStart();
        break;
      case "update":
        callbacks.onUpdate(msg.output, msg.tps, msg.numTokens, msg.state);
        break;
      case "complete":
        callbacks.setStatus("complete");
        callbacks.onComplete();
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setErrorMsg(msg.error);
        break;
    }
  };
};
