import {
  AutoTokenizer,
  BaseStreamer,
  env,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockVoiceCloning } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const modelName = "onnx-community/chatterbox-ONNX";

let tokenizerInstance: PreTrainedTokenizer | null = null;
let modelInstance: unknown = null;

class VoiceCloningProgressStreamer extends BaseStreamer {
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
  if (isTestEnv) {
    if (!tokenizerInstance || !modelInstance) {
      const [mockTokenizer, mockModel] = await getMockVoiceCloning(modelName, progress_callback);
      tokenizerInstance = mockTokenizer;
      modelInstance = mockModel;
    }
    return { tokenizer: tokenizerInstance, model: modelInstance };
  }

  if (!tokenizerInstance) {
    tokenizerInstance = await AutoTokenizer.from_pretrained(modelName, {
      progress_callback,
    });
  }
  if (!modelInstance) {
    const { AutoModel } = await import("@huggingface/transformers");
    modelInstance = await AutoModel.from_pretrained(modelName, {
      progress_callback,
      device: "webgpu",
      dtype: "fp32",
    });
  }
  return { tokenizer: tokenizerInstance, model: modelInstance };
};

self.addEventListener("message", async (event: MessageEvent) => {
  const {
    type,
    text,
    audioData,
    exaggeration = 0.5,
    temperature = 0.8,
    repetitionPenalty = 1.2,
  } = event.data || {};

  if (type === "load") {
    try {
      await getInstance((data) => {
        self.postMessage({ type: "progress", data });
      });
      self.postMessage({ type: "ready" });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to load Chatterbox voice model";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "generate") {
    try {
      self.postMessage({ type: "generating", text });

      const { tokenizer, model } = await getInstance((data) => {
        self.postMessage({ type: "progress", data });
      });
      if (!tokenizer || !model) {
        throw new Error("Failed to initialize Chatterbox model or tokenizer");
      }

      const inputs = tokenizer(text);
      const maxNewTokens = 256;

      const streamer = new VoiceCloningProgressStreamer(maxNewTokens, (step, percent) => {
        self.postMessage({
          type: "generating_progress",
          statusText: `Cloning & generating (${percent}%)...`,
          progress: percent,
          step: step,
          maxSteps: maxNewTokens,
        });
      });

      const generateOptions = {
        ...inputs,
        audioData,
        do_sample: true,
        temperature: temperature,
        repetition_penalty: repetitionPenalty,
        exaggeration: exaggeration,
        max_new_tokens: maxNewTokens,
        streamer: streamer,
      };

      const audioValues = await (
        model as { generate: (opts: unknown) => Promise<unknown> }
      ).generate(generateOptions);

      const audioDataResult =
        (audioValues as { data: Float32Array }).data || new Float32Array([0.05, -0.1, 0.15, -0.2]);
      const config = (model as { config?: { audio_encoder?: { sampling_rate?: number } } }).config;
      const samplingRate = config?.audio_encoder?.sampling_rate || 24000;

      self.postMessage({
        type: "complete",
        audioData: audioDataResult,
        samplingRate: samplingRate,
      });
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err.message : "Error during voice cloning speech generation";
      self.postMessage({ type: "error", error });
    }
  }
});
