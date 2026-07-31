import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  PreTrainedModel,
  PreTrainedTokenizer,
  env,
} from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockLLM } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const MODEL_ID = "onnx-community/translategemma-text-4b-it-ONNX";

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
    dtype: "q4",
    device: "webgpu",
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
  self.postMessage({
    type: "loading",
    data: "Loading TranslateGemma model...",
  });

  const [tokenizer, model] = await getInstance((x) => {
    self.postMessage({ type: "progress", data: x });
  });

  self.postMessage({
    type: "loading",
    data: "Compiling shaders and warming up model...",
  });

  const inputs = tokenizer("Hello");
  await model.generate({ ...inputs, max_new_tokens: 1 });
  self.postMessage({ type: "ready" });
};

export interface TranslateData {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface GenerateOutput {
  sequences: number[][];
}

const translate = async ({ text, sourceLang, targetLang }: TranslateData) => {
  try {
    const [tokenizer, model] = await getInstance();

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            source_lang_code: sourceLang === "auto" ? "en" : sourceLang,
            target_lang_code: targetLang,
            text,
          },
        ],
      },
    ];

    let inputs;
    try {
      inputs = tokenizer.apply_chat_template(messages, {
        add_generation_prompt: true,
        return_dict: true,
      });
    } catch {
      const prompt = `<<<source>>>${sourceLang === "auto" ? "en" : sourceLang}<<<target>>>${targetLang}<<<text>>>${text}`;
      inputs = tokenizer(prompt);
    }

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
        output,
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
      do_sample: false,
      max_new_tokens: isTestEnv ? 100 : 2048,
      streamer,
      stopping_criteria,
      return_dict_in_generate: true,
    })) as unknown as GenerateOutput;

    const inputTokenCount = inputs.input_ids?.dims
      ? inputs.input_ids.dims[inputs.input_ids.dims.length - 1]
      : Array.isArray(inputs.input_ids)
        ? inputs.input_ids.length
        : 0;

    const { sequences } = output;
    const rawSequence = Array.isArray(sequences[0])
      ? sequences[0]
      : Array.from(sequences[0] as unknown as ArrayLike<number>);
    const generatedTokens = rawSequence.slice(inputTokenCount);
    const decoded = tokenizer.decode(generatedTokens, {
      skip_special_tokens: true,
    });

    self.postMessage({
      type: "complete",
      result: [decoded.trim()],
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
    case "translate":
      stopping_criteria.reset();
      translate(data as TranslateData);
      break;
    case "interrupt":
      stopping_criteria.interrupt();
      break;
    case "reset":
      stopping_criteria.reset();
      break;
  }
});
