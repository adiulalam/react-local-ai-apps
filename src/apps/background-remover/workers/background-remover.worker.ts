import {
  AutoModel,
  AutoProcessor,
  RawImage,
  env,
  type PreTrainedModel,
  type Processor,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockBackgroundRemover } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const model_id = "Xenova/modnet";

let modelPromise: Promise<PreTrainedModel> | null = null;
let processorPromise: Promise<Processor> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (isTestEnv) {
    if (modelPromise === null) {
      const [mockModel, mockProcessor] = await getMockBackgroundRemover(
        model_id,
        progress_callback
      );
      modelPromise = Promise.resolve(mockModel);
      processorPromise = Promise.resolve(mockProcessor);
    }
    return Promise.all([modelPromise, processorPromise]);
  }

  if (modelPromise === null) {
    modelPromise = AutoModel.from_pretrained(model_id, {
      device: "webgpu",
      dtype: "fp32",
      progress_callback,
    });
  }
  if (processorPromise === null) {
    processorPromise = AutoProcessor.from_pretrained(model_id);
  }
  return Promise.all([modelPromise, processorPromise]);
};

export const processImage = async (
  model: PreTrainedModel,
  processor: Processor,
  imageSrc: string,
  postMessage: (msg: { type: string; result?: unknown; error?: string }) => void
) => {
  try {
    postMessage({ type: "processing" });

    const img = await RawImage.fromURL(imageSrc);
    const { pixel_values } = await processor(img);
    const { output } = await model({ input: pixel_values });

    const maskRawImage = await RawImage.fromTensor(output[0].mul(255).to("uint8"));
    const resizedMask = await maskRawImage.resize(img.width, img.height);
    const maskData = resizedMask.data;

    postMessage({ type: "complete", result: { maskData, width: img.width, height: img.height } });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error during background removal";
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
      const [model, processor] = await getInstance(() => {});
      await processImage(model, processor!, image, (msg) => self.postMessage(msg));
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error setting up processing";
      self.postMessage({ type: "error", error });
    }
  }
});
