import {
  ChatterboxModel,
  AutoProcessor,
  Tensor,
  env,
  BaseStreamer,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockVoiceCloning } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const MODEL_ID = "ResembleAI/chatterbox-turbo-ONNX";

type ChatterboxModelInstance = {
  encode_speech: (audioTensor: unknown) => Promise<Record<string, unknown>>;
  generate: (opts: Record<string, unknown>) => Promise<{ data: Float32Array }>;
  config?: { audio_encoder?: { sampling_rate?: number } };
};

type ProcessorInstance = {
  _call: (text: string) => Promise<Record<string, unknown>>;
};

let model: ChatterboxModelInstance | null = null;
let processor: ProcessorInstance | null = null;
const speakerCache = new Map<string, Record<string, unknown>>();

class VoiceProgressStreamer extends BaseStreamer {
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

// Only language_model has quantized variants in the repo.
// Other sessions (embed_tokens, speech_encoder, conditional_decoder) are fp32 only.
const DTYPE_CONFIGS = {
  wasm: {
    embed_tokens: "fp32",
    speech_encoder: "fp32",
    language_model: "q4",
    conditional_decoder: "fp32",
  },
  webgpu: {
    embed_tokens: "fp32",
    speech_encoder: "fp32",
    language_model: "q4f16",
    conditional_decoder: "fp32",
  },
} as const;

const checkWebGPU = async (): Promise<{ available: boolean; reason?: string }> => {
  if (!navigator.gpu) {
    return { available: false, reason: "WebGPU not supported" };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { available: false, reason: "No GPU adapter found" };
    }
    return { available: true };
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : "Unknown error";
    return { available: false, reason };
  }
};

const load = async () => {
  const progressCallback = (progress: unknown) => {
    self.postMessage({ type: "load:progress", data: progress });
  };

  if (model && processor) {
    const webgpu = await checkWebGPU();
    const useDevice = webgpu.available ? "webgpu" : "wasm";
    self.postMessage({
      type: "load:complete",
      data: { device: useDevice, webgpu: webgpu.available },
    });
    return;
  }

  if (isTestEnv) {
    const [mockProcessor, mockModel] = await getMockVoiceCloning(MODEL_ID, progressCallback);
    processor = mockProcessor as ProcessorInstance;
    model = mockModel as ChatterboxModelInstance;
    self.postMessage({ type: "load:complete", data: {} });
    return;
  }

  const webgpu = await checkWebGPU();
  const useDevice = webgpu.available ? "webgpu" : "wasm";
  const useDtype = DTYPE_CONFIGS[useDevice] || DTYPE_CONFIGS.wasm;

  processor = (await AutoProcessor.from_pretrained(MODEL_ID)) as unknown as ProcessorInstance;

  model = (await ChatterboxModel.from_pretrained(MODEL_ID, {
    device: useDevice,
    dtype: useDtype,
    progress_callback: progressCallback,
  })) as unknown as ChatterboxModelInstance;

  self.postMessage({
    type: "load:complete",
    data: { device: useDevice, webgpu: webgpu.available },
  });
};

const encodeSpeaker = async (data: { id: string; audioData: Float32Array }) => {
  const { id, audioData } = data;
  if (!model) {
    throw new Error("Model not loaded");
  }

  const audioFloat32 = new Float32Array(audioData);
  // encode_speech expects a Tensor with shape [1, num_samples]
  const audioTensor = new Tensor("float32", audioFloat32, [1, audioFloat32.length]);

  const result = await model.encode_speech(audioTensor);
  speakerCache.set(id, result);

  self.postMessage({ type: "encode_speaker:complete", data: { id } });
};

const generate = async (data: { text: string; speakerId: string; exaggeration?: number }) => {
  const { text, speakerId, exaggeration = 0.5 } = data;
  if (!model || !processor) {
    throw new Error("Model not loaded");
  }

  const speakerEmbeddings = speakerCache.get(speakerId);
  if (!speakerEmbeddings) {
    throw new Error(`Speaker "${speakerId}" not found in cache`);
  }

  // Processor returns { input_ids, attention_mask } for text-only call
  const inputs = await processor._call(text);

  const max_new_tokens = 256;
  const streamer = new VoiceProgressStreamer(max_new_tokens, (step, percent) => {
    self.postMessage({
      type: "generate:progress",
      data: { percent, step, maxSteps: max_new_tokens },
    });
  });

  // generate() takes input_ids, attention_mask, speaker embeddings, and exaggeration
  // max_new_tokens=256 matches the reference implementation
  const waveform = await model.generate({
    ...inputs,
    ...speakerEmbeddings,
    exaggeration,
    max_new_tokens,
    streamer,
  });

  const waveformData = waveform.data;
  const buffer = waveformData.buffer.slice(
    waveformData.byteOffset,
    waveformData.byteOffset + waveformData.byteLength
  );

  self.postMessage(
    { type: "generate:complete", data: { waveform: buffer } },
    { transfer: [buffer] }
  );
};

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, data } = event.data || {};

  try {
    switch (type) {
      case "check_webgpu": {
        const result = await checkWebGPU();
        self.postMessage({ type: "check_webgpu:complete", data: result });
        break;
      }
      case "load":
        await load();
        break;
      case "encode_speaker":
        await encodeSpeaker(data);
        break;
      case "generate":
        await generate(data);
        break;
      default:
        self.postMessage({
          type: "error",
          data: { message: `Unknown message type: ${type}` },
        });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    const stack = err instanceof Error ? err.stack : undefined;
    self.postMessage({ type: "error", data: { message, stack } });
  }
});
