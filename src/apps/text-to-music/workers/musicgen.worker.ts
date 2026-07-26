import {
  AutoTokenizer,
  MusicgenForConditionalGeneration,
  BaseStreamer,
  env,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const modelName = isTestEnv ? "/models/musicgen-small" : "Xenova/musicgen-small";

let tokenizerInstance: PreTrainedTokenizer | null = null;
let modelInstance: MusicgenForConditionalGeneration | null = null;

class MusicProgressStreamer extends BaseStreamer {
  private stepCount = 0;
  private maxNewTokens: number;
  private onProgress: (step: number, percent: number) => void;

  constructor(maxNewTokens: number, onProgress: (step: number, percent: number) => void) {
    super();
    this.maxNewTokens = maxNewTokens;
    this.onProgress = onProgress;
  }

  override put() {
    this.stepCount++;
    const percent = Math.min(99, Math.round((this.stepCount / this.maxNewTokens) * 100));
    this.onProgress(this.stepCount, percent);
  }

  override end() {}
}

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (!tokenizerInstance) {
    tokenizerInstance = await AutoTokenizer.from_pretrained(modelName, {
      progress_callback,
    });
  }
  if (!modelInstance) {
    modelInstance = (await MusicgenForConditionalGeneration.from_pretrained(modelName, {
      progress_callback,
      device: isTestEnv ? "wasm" : "webgpu",
      dtype: "fp32",
    })) as unknown as MusicgenForConditionalGeneration;
  }
  return { tokenizer: tokenizerInstance, model: modelInstance };
};

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, text, duration = 10, guidanceScale = 3.0, temperature = 1.0 } = event.data || {};

  if (type === "load") {
    try {
      await getInstance((data) => {
        self.postMessage({ type: "progress", data });
      });
      self.postMessage({ type: "ready" });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to load MusicGen model";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "generate") {
    try {
      self.postMessage({ type: "generating", text });

      const { tokenizer, model } = await getInstance((data) => {
        self.postMessage({ type: "progress", data });
      });
      if (!tokenizer || !model) {
        throw new Error("Failed to initialize model or tokenizer");
      }

      const inputs = tokenizer(text);
      const maxNewTokens = Math.round(duration * 50);

      const streamer = new MusicProgressStreamer(maxNewTokens, (step, percent) => {
        self.postMessage({
          type: "generating_progress",
          statusText: `Generating (${percent}%)...`,
          progress: percent,
          step: step,
          maxSteps: maxNewTokens,
        });
      });

      const generateOptions = {
        ...inputs,
        do_sample: true,
        guidance_scale: guidanceScale,
        temperature: temperature,
        max_new_tokens: maxNewTokens,
        streamer: streamer,
      };

      const audioValues = await model.generate(
        generateOptions as unknown as Parameters<typeof model.generate>[0]
      );

      const audioData = (audioValues as { data: Float32Array }).data;
      const config = model.config as { audio_encoder?: { sampling_rate?: number } };
      const samplingRate = config?.audio_encoder?.sampling_rate || 32000;

      self.postMessage({
        type: "complete",
        audioData: audioData,
        samplingRate: samplingRate,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Error during music generation";
      self.postMessage({ type: "error", error });
    }
  }
});
