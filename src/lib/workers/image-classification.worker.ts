import {
  pipeline,
  env,
  type PipelineType,
  type AllTasks,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
  static task: PipelineType = "image-classification";
  static model = "onnx-community/mobilenetv3_small_100.lamb_in1k";
  static instance: Promise<AllTasks["image-classification"]> | null = null;

  static async getInstance(progress_callback: (info: unknown) => void) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        device: "webgpu",
      }) as Promise<AllTasks["image-classification"]>;
    }
    return this.instance;
  }
}

export const processImage = async (
  classifier: AllTasks["image-classification"],
  image: string,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    const results = await classifier(image, {
      top_k: 3,
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
      await PipelineSingleton.getInstance((x) => {
        self.postMessage({ type: "progress", data: x });
      });
      self.postMessage({ type: "ready" });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error loading model";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "process") {
    try {
      const classifier = await PipelineSingleton.getInstance(() => {});
      await processImage(classifier, image, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error setting up classification";
      self.postMessage({ type: "error", error });
    }
  }
});
