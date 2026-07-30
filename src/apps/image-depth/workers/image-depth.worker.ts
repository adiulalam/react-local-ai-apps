import { pipeline, env, type PipelineType, type AllTasks } from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockPipeline } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const task: PipelineType = "depth-estimation";
const model = "Xenova/depth-anything-small-hf";

let instance: Promise<AllTasks["depth-estimation"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    if (isTestEnv) {
      instance = Promise.resolve(getMockPipeline(task, model, progress_callback));
    } else {
      instance = pipeline(task, model, {
        progress_callback,
        dtype: "fp32",
        device: "webgpu",
      }) as Promise<AllTasks["depth-estimation"]>;
    }
  }
  return instance;
};

export const processImage = async (
  depthEstimator: AllTasks["depth-estimation"],
  image: string,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    const output = (await depthEstimator(image)) as {
      depth: {
        width: number;
        height: number;
        channels: number;
        data: Uint8Array;
      };
    };

    const depthImage = output.depth;

    postMessage({
      type: "complete",
      result: {
        data: Array.from(depthImage.data),
        width: depthImage.width,
        height: depthImage.height,
        channels: depthImage.channels ?? 1,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error during depth estimation";
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
      const depthEstimator = await getInstance(() => {});
      await processImage(depthEstimator, image, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err.message : "Unknown error setting up depth estimation";
      self.postMessage({ type: "error", error });
    }
  }
});
