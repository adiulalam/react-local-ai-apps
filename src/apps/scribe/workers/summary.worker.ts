import {
  pipeline,
  env,
  TextStreamer,
  type PipelineType,
  type AllTasks,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const task: PipelineType = "summarization";
const model = isTestEnv ? "/models/tiny-bart" : "Xenova/distilbart-cnn-6-6";
let instance: Promise<AllTasks["summarization"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    instance = pipeline(task, model, {
      progress_callback,
      device: isTestEnv ? "wasm" : "webgpu",
      dtype: "fp32", // fp32 is the safest full-precision fallback for webgpu ops on distilbart
    }) as Promise<AllTasks["summarization"]>;
  }
  return instance;
};

self.addEventListener("message", async (event) => {
  const { type, text, options } = event.data;

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
      self.postMessage({ type: "processing" });
      const summarizer = await getInstance(() => {});

      const streamer = new TextStreamer(summarizer.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (output: string) => {
          self.postMessage({ type: "update", output });
        },
      });

      const result = await summarizer(text, {
        max_new_tokens: isTestEnv ? 20 : (options?.max_length || 150),
        min_length: isTestEnv ? 5 : (options?.min_length || 30),
        truncation: true,
        streamer,
      });

      // result format for summarization is [{ summary_text: "..." }]
      self.postMessage({ type: "complete", result: result[0].summary_text });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error during summarization";
      self.postMessage({ type: "error", error });
    }
  }
});
