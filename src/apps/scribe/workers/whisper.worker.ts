import {
  pipeline,
  env,
  TextStreamer,
  type PipelineType,
  type AllTasks,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockPipeline } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const task: PipelineType = "automatic-speech-recognition";
const model = isTestEnv ? "/models/whisper-tiny" : "onnx-community/whisper-base";
let instance: Promise<AllTasks["automatic-speech-recognition"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    if (isTestEnv) {
      instance = Promise.resolve(getMockPipeline(task, model, progress_callback));
    } else {
      instance = pipeline(task, model, {
        progress_callback,
        device: "webgpu",
        dtype: "fp32",
      }) as Promise<AllTasks["automatic-speech-recognition"]>;
    }
  }
  return instance;
};

self.addEventListener("message", async (event) => {
  const { type, audio } = event.data;

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
      const transcriber = await getInstance(() => {});

      const streamer = new TextStreamer(transcriber.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (output: string) => {
          self.postMessage({ type: "update", output });
        },
      });

      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: "en",
        task: "transcribe",
        streamer,
      });

      const output = Array.isArray(result) ? result[0] : result;
      self.postMessage({ type: "complete", result: output.text });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error during transcription";
      self.postMessage({ type: "error", error });
    }
  }
});
