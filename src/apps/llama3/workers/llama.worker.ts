import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  PreTrainedModel,
  PreTrainedTokenizer,
  DynamicCache,
  env,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const MODEL_ID = isTestEnv ? "/models/tiny-llama" : "onnx-community/Llama-3.2-1B-Instruct-ONNX";

let tokenizerPromise: Promise<PreTrainedTokenizer> | null = null;
let modelPromise: Promise<PreTrainedModel> | null = null;

const getInstance = async (progress_callback?: (info: unknown) => void) => {
  tokenizerPromise ??= AutoTokenizer.from_pretrained(MODEL_ID, {
    progress_callback,
  });

  modelPromise ??= AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    dtype: isTestEnv ? "q4f16" : "q4f16",
    device: isTestEnv ? "wasm" : "webgpu",
    progress_callback,
  });

  return Promise.all([tokenizerPromise, modelPromise]);
};

const stopping_criteria = new InterruptableStoppingCriteria();

const check = async () => {
  if (isTestEnv) return;

  try {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU is not supported (no adapter found)");
    }
  } catch (e) {
    self.postMessage({
      type: "error",
      error: (e as Error).toString(),
    });
  }
};

const load = async () => {
  try {
    self.postMessage({
      type: "loading",
      data: "Loading model...",
    });

    const [tokenizer, model] = await getInstance((x) => {
      self.postMessage({ type: "progress", data: x });
    });

    self.postMessage({
      type: "loading",
      data: "Compiling shaders and warming up model...",
    });

    const inputs = tokenizer("a");
    await model.generate({ ...inputs, max_new_tokens: 1 });
    self.postMessage({ type: "ready" });
  } catch (e) {
    self.postMessage({
      type: "error",
      error: (e as Error).toString(),
    });
  }
};

export interface GenerateData {
  messages: { role: string; content: string }[];
}

interface GenerateOutput {
  past_key_values: DynamicCache;
  sequences: number[][];
}

const generate = async ({ messages }: GenerateData) => {
  const [tokenizer, model] = await getInstance();

  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });

  let startTime: number | undefined;
  let numTokens = 0;
  let tps: number | undefined;

  const token_callback_function = () => {
    startTime ??= performance.now();

    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
  };

  const callback_function = (output: string) => {
    self.postMessage({
      type: "update",
      result: output,
      tps,
      numTokens,
    });
  };

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
    token_callback_function,
  });

  self.postMessage({ type: "start" });

  const output = (await model.generate({
    ...inputs,
    // past_key_values: past_key_values_cache, // Disabled per Hugging Face example TODO
    do_sample: false, // Recommended by Hugging Face for this model
    repetition_penalty: 1.1,
    max_new_tokens: isTestEnv ? 300 : 8192,
    streamer,
    stopping_criteria,
    return_dict_in_generate: true,
  })) as unknown as GenerateOutput;

  const { sequences } = output;

  const decoded = tokenizer.batch_decode(sequences, {
    skip_special_tokens: true,
  });

  self.postMessage({
    type: "complete",
    result: decoded,
  });
};

self.addEventListener("message", async (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case "check":
      check();
      break;
    case "load":
      load();
      break;
    case "generate":
      stopping_criteria.reset();
      generate(data as GenerateData);
      break;
    case "interrupt":
      stopping_criteria.interrupt();
      break;
    case "reset":
      stopping_criteria.reset();
      break;
  }
});
