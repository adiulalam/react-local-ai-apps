import { AutoTokenizer, PreTrainedTokenizer, env } from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockLLM } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const TOKENIZER_MAPPINGS = new Map<string, Promise<PreTrainedTokenizer>>();

const load = async (model_id: string, progress_callback?: (info: unknown) => void) => {
  let tokenizerPromise = TOKENIZER_MAPPINGS.get(model_id);
  if (!tokenizerPromise) {
    if (isTestEnv) {
      tokenizerPromise = getMockLLM(model_id, progress_callback).then((res) => {
        const tokenizer = res[0] as PreTrainedTokenizer;
        // @ts-expect-error accessing internal config
        tokenizer._tokenizer_config = { tokenizer_class: "LlamaTokenizer" };
        // @ts-expect-error accessing internal decoder
        tokenizer.decoder = { decoders: [{}] };
        tokenizer.encode = () => [1, 2];
        tokenizer.decode = (ids: number[]) => {
          if (ids[0] === 1) return "E2E";
          if (ids[0] === 2) return "test";
          return "mock";
        };
        return tokenizer;
      });
    } else {
      tokenizerPromise = AutoTokenizer.from_pretrained(model_id, {
        progress_callback,
      }).then((tokenizer: PreTrainedTokenizer) => {
        // @ts-expect-error accessing internal config
        const tokenizer_class = (tokenizer._tokenizer_config?.tokenizer_class ?? "").replace(
          /Fast$/,
          ""
        );
        switch (tokenizer_class) {
          case "LlamaTokenizer":
          case "Grok1Tokenizer":
            // @ts-expect-error accessing internal decoder
            tokenizer.decoder.decoders.pop();
            break;
          case "T5Tokenizer":
            // @ts-expect-error accessing internal decoder
            tokenizer.decoder.addPrefixSpace = false;
            break;
        }
        return tokenizer;
      });
    }

    TOKENIZER_MAPPINGS.set(model_id, tokenizerPromise);
  }

  await tokenizerPromise;
};

const tokenize = async (model_id: string, text: string) => {
  const tokenizerPromise = TOKENIZER_MAPPINGS.get(model_id);
  if (!tokenizerPromise) {
    throw new Error("Tokenizer not loaded");
  }

  const tokenizer = await tokenizerPromise;

  const token_ids = tokenizer.encode(text);
  let decoded: string[] = Array.from(token_ids).map((x) => tokenizer.decode([x as number]));

  let margins: number[] = [];
  switch (tokenizer.constructor.name) {
    case "BertTokenizer":
      margins = decoded.map((x, i) => (i === 0 || (x as string).startsWith("##") ? 0 : 8));
      decoded = decoded.map((x) => (x as string).replace("##", ""));
      break;
    case "T5Tokenizer":
      if (decoded.length > 0 && decoded[0] !== " ") {
        decoded[0] = (decoded[0] as string).replace(/^ /, "");
      }
      break;
  }

  self.postMessage({
    type: "tokenized",
    data: {
      token_ids,
      decoded,
      margins,
    },
  });
};

self.addEventListener("message", async (e: MessageEvent) => {
  const { type, model_id, text } = e.data;

  try {
    switch (type) {
      case "load":
        self.postMessage({
          type: "loading",
          data: "Loading tokenizer...",
        });
        await load(model_id, (x) => {
          self.postMessage({ type: "progress", data: x });
        });
        self.postMessage({ type: "ready" });
        break;
      case "tokenize":
        await tokenize(model_id, text);
        break;
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: (error as Error).toString(),
    });
  }
});
