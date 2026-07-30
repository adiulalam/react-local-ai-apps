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
import { getMockLLM } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const MODEL_ID = isTestEnv ? "/models/tiny-qwen" : "onnx-community/Qwen3-0.6B-ONNX";

let tokenizerPromise: Promise<PreTrainedTokenizer> | null = null;
let modelPromise: Promise<PreTrainedModel> | null = null;

const getInstance = async (progress_callback?: (info: unknown) => void) => {
  if (isTestEnv) {
    if (!tokenizerPromise || !modelPromise) {
      const [mockTokenizer, mockModel] = await getMockLLM(MODEL_ID, progress_callback);
      tokenizerPromise = Promise.resolve(mockTokenizer);
      modelPromise = Promise.resolve(mockModel);
    }
    return Promise.all([tokenizerPromise, modelPromise]);
  }

  tokenizerPromise ??= AutoTokenizer.from_pretrained(MODEL_ID, {
    progress_callback,
  });

  modelPromise ??= AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    device: "webgpu",
    progress_callback,
  });

  return Promise.all([tokenizerPromise, modelPromise]);
};

const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: DynamicCache | null | undefined = null;

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
};

export interface GenerateData {
  messages: { role: string; content: string }[];
  reasonEnabled: boolean;
}

interface GenerateOutput {
  past_key_values: DynamicCache;
  sequences: number[][];
}

const generate = async ({ messages, reasonEnabled }: GenerateData) => {
  try {
    const [tokenizer, model] = await getInstance();

    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
      // @ts-expect-error type missing in library
      enable_thinking: reasonEnabled,
    });

    const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode("<think></think>", {
      add_special_tokens: false,
    });

    let state = "answering";
    let startTime: number | undefined;
    let numTokens = 0;
    let tps: number | undefined;

    const token_callback_function = (tokens: bigint[]) => {
      startTime ??= performance.now();

      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }
      const token = Number(tokens[0]);
      if (token === START_THINKING_TOKEN_ID) {
        state = "thinking";
      } else if (token === END_THINKING_TOKEN_ID) {
        state = "answering";
      }
    };

    const callback_function = (output: string) => {
      self.postMessage({
        type: "update",
        output,
        tps,
        numTokens,
        state,
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
      past_key_values: past_key_values_cache,
      do_sample: true,
      top_k: 20,
      temperature: reasonEnabled ? 0.6 : 0.7,
      max_new_tokens: isTestEnv ? 100 : 16384,
      streamer,
      stopping_criteria,
      return_dict_in_generate: true,
    })) as unknown as GenerateOutput;

    const { past_key_values, sequences } = output;
    past_key_values_cache = past_key_values;

    const decoded = tokenizer.batch_decode(sequences, {
      skip_special_tokens: true,
    });

    self.postMessage({
      type: "complete",
      result: decoded,
    });
  } catch (e) {
    self.postMessage({ type: "error", error: String(e) });
  }
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
      past_key_values_cache = null;
      stopping_criteria.reset();
      break;
  }
});
