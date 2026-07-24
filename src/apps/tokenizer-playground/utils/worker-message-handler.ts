import { type ProgressItem } from "@/components/chat";

export type WorkerStatus = "idle" | "loading" | "ready" | "error";

export interface TokenizedData {
  token_ids: number[];
  decoded: string[];
  margins: number[];
}

export interface WorkerCallbacks {
  setStatus: (status: WorkerStatus) => void;
  setLoadingMessage: (msg: string) => void;
  setProgressItems: (updater: (prev: ProgressItem[]) => ProgressItem[]) => void;
  onReady: () => void;
  onTokenized: (data: TokenizedData) => void;
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
      case "tokenized":
        callbacks.onTokenized(msg.data);
        break;
      case "error":
        callbacks.setStatus("error");
        callbacks.setErrorMsg(msg.error);
        break;
    }
  };
};
