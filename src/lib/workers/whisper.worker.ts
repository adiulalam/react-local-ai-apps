import {
  pipeline,
  env,
  TextStreamer,
  type PipelineType,
  type AllTasks,
} from "@huggingface/transformers";
import { isTestEnv } from "../utils";

env.allowLocalModels = false;
env.useBrowserCache = true;

const task: PipelineType = "automatic-speech-recognition";
const model = isTestEnv
  ? "/models/tiny-whisper"
  : "onnx-community/whisper-base";
let instance: Promise<AllTasks["automatic-speech-recognition"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (instance === null) {
    instance = pipeline(task, model, {
      progress_callback,
      device: "webgpu",
      dtype: {
        encoder_model: "fp32",
        decoder_model_merged: "q4",
      },
    }) as Promise<AllTasks["automatic-speech-recognition"]>;
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

      self.postMessage({ type: "complete", result: result.text });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error during transcription";
      self.postMessage({ type: "error", error });
    }
  }
});
