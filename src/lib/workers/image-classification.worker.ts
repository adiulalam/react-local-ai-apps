import { pipeline, env, type PipelineType, type AllTasks } from "@huggingface/transformers";
import { isTestEnv } from "../utils";

env.allowLocalModels = false;
env.useBrowserCache = true;

const task: PipelineType = "image-classification";
const model = isTestEnv
  ? "/models/tiny-resnet"
  : "Xenova/resnet-50";
let instance: Promise<AllTasks["image-classification"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    instance = pipeline(task, model, {
      progress_callback,
      dtype: "fp32",
    }) as Promise<AllTasks["image-classification"]>;
  }
  return instance;
};

export const processImage = async (
  classifier: AllTasks["image-classification"],
  image: string,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    const results = await classifier(image, {
      top_k: 5,
    });

    postMessage({ type: "complete", result: results });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error during image classification";
    postMessage({ type: "error", error });
  }
};

self.addEventListener("message", async (event) => {
  const { type, image } = event.data;

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
      const classifier = await getInstance(() => {});
      await processImage(classifier, image, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error setting up classification";
      self.postMessage({ type: "error", error });
    }
  }
});
