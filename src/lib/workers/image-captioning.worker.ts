import {
  pipeline,
  env,
  type PipelineType,
  type AllTasks,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
  static task: PipelineType = "image-to-text";
  static model = "Xenova/vit-gpt2-image-captioning";
  static instance: Promise<AllTasks["image-to-text"]> | null = null;

  static async getInstance(progress_callback: (info: unknown) => void) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        dtype: "fp32",
      }) as Promise<AllTasks["image-to-text"]>;
    }
    return this.instance;
  }
}

export const generateCaption = async (
  captioner: AllTasks["image-to-text"],
  image: string,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    const results = await captioner(image);
    // results is typically an array of objects like [{ generated_text: "a cat sitting on a couch" }]
    const caption = Array.isArray(results) && results.length > 0 
      ? (results[0] as { generated_text: string }).generated_text 
      : "No caption generated.";

    postMessage({ type: "complete", result: caption });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error during image captioning";
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
      const captioner = await PipelineSingleton.getInstance(() => {});
      await generateCaption(captioner, image, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error setting up captioning";
      self.postMessage({ type: "error", error });
    }
  }
});
