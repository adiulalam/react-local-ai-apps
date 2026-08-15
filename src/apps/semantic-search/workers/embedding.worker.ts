import { pipeline, env, type PipelineType, type AllTasks } from "@huggingface/transformers";
import { isTestEnv } from "@/lib/utils";
import { getMockFeatureExtraction } from "@/lib/mock-pipelines";

env.allowLocalModels = isTestEnv;
env.useBrowserCache = !isTestEnv;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

const task: PipelineType = "feature-extraction";
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let instance: Promise<AllTasks["feature-extraction"]> | null = null;

const getInstance = async (progress_callback: (info: unknown) => void) => {
  if (isTestEnv) {
    if (instance === null) {
      instance = getMockFeatureExtraction(MODEL_ID, progress_callback);
    }
    return instance;
  }

  if (instance === null) {
    instance = pipeline(task, MODEL_ID, {
      progress_callback,
      device: "webgpu",
      dtype: "fp32",
    }) as Promise<AllTasks["feature-extraction"]>;
  }
  return instance;
};

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, chunks, query, queryId } = event.data;

  if (type === "load") {
    try {
      await getInstance((x) => {
        self.postMessage({ type: "progress", data: x });
      });
      self.postMessage({ type: "ready" });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error loading embedding model";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "batch_embed") {
    try {
      const extractor = await getInstance(() => {});
      const textList: string[] = chunks || [];
      const embeddings: Float32Array[] = [];

      for (let i = 0; i < textList.length; i++) {
        const output = (await extractor(textList[i], {
          pooling: "mean",
          normalize: true,
        })) as { data: Float32Array | number[] };

        const data =
          output.data instanceof Float32Array ? output.data : new Float32Array(output.data);
        embeddings.push(data);

        self.postMessage({
          type: "indexing_progress",
          data: {
            current: i + 1,
            total: textList.length,
            percentage: Math.round(((i + 1) / textList.length) * 100),
          },
        });
      }

      self.postMessage({ type: "batch_embed_complete", embeddings });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to embed document chunks";
      self.postMessage({ type: "error", error });
    }
  } else if (type === "query_embed") {
    try {
      const extractor = await getInstance(() => {});
      const output = (await extractor(query, {
        pooling: "mean",
        normalize: true,
      })) as { data: Float32Array | number[] };

      const data =
        output.data instanceof Float32Array ? output.data : new Float32Array(output.data);

      self.postMessage({ type: "query_embed_complete", embedding: data, queryId });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to embed search query";
      self.postMessage({ type: "error", error });
    }
  }
});
