import { pipeline, env, type PipelineType, type AllTasks } from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockPipeline } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const task: PipelineType = "object-detection";
// We use a robust, but very fast tiny model for real-time video object detection.
const model = isTestEnv ? "/models/yolos-tiny" : "Xenova/yolos-tiny";
let instance: Promise<AllTasks["object-detection"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    if (isTestEnv) {
      instance = Promise.resolve(getMockPipeline(task, model, progress_callback));
    } else {
      instance = pipeline(task, model, {
        progress_callback,
        device: "webgpu",
      }) as Promise<AllTasks["object-detection"]>;
    }
  }
  return instance;
};

export const processImage = async (
  detector: AllTasks["object-detection"],
  image: string,
  threshold: number = 0.5,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    // Ensure we threshold low-confidence detections
    const results = await detector(image, {
      threshold,
      percentage: true, // Output relative coordinates for easier canvas drawing
    });

    postMessage({ type: "complete", result: results });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error during object detection";
    postMessage({ type: "error", error });
  }
};

self.addEventListener("message", async (event) => {
  const { type, image, threshold } = event.data;

  if (type === "load") {
    try {
      await getInstance((x) => {
        self.postMessage({ type: "progress", data: x });
      });
      self.postMessage({ type: "ready" });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error loading model";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "process") {
    try {
      const detector = await getInstance(() => {});
      await processImage(detector, image, threshold ?? 0.5, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error setting up detection";
      self.postMessage({ type: "error", error });
    }
  }
});
