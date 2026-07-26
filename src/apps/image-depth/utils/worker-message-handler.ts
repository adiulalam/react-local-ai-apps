export {
  createWorkerMessageHandler,
  type WorkerStatus,
  type WorkerCallbacks,
} from "@/apps/image-classifier/utils/worker-message-handler";

export interface DepthResult {
  data: number[];
  width: number;
  height: number;
  channels: number;
}
