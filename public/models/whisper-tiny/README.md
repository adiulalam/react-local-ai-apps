---
tags:
- transformers.js
---

Code to generate:

```py
from transformers import WhisperForConditionalGeneration, AutoProcessor

new_config_values = dict(
  d_model = 16,
  decoder_attention_heads = 4,
  decoder_layers = 1,
  encoder_attention_heads = 4,
  encoder_layers = 1,
  num_hidden_layers = 1,

  ignore_mismatched_sizes=True,
)
original_model = WhisperForConditionalGeneration.from_pretrained('openai/whisper-tiny', **new_config_values)
original_model.save_pretrained('converted')

original_processor = AutoProcessor.from_pretrained('openai/whisper-tiny')
original_processor.save_pretrained('converted')
```

Followed by:
```sh
$ mkdir -p ./converted/onnx
$ optimum-cli export onnx -m ./converted ./converted/onnx --task automatic-speech-recognition-with-past
$ find ./converted/onnx -type f ! -name "*.onnx" -delete
```

## Usage (Transformers.js)

If you haven't already, you can install the [Transformers.js](https://huggingface.co/docs/transformers.js) JavaScript library from [NPM](https://www.npmjs.com/package/@huggingface/transformers) using:
```bash
npm i @huggingface/transformers
```

**Example:** Transcribe audio from a URL.

```js
import { pipeline } from '@huggingface/transformers';

const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/tiny-random-WhisperForConditionalGeneration');
const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav';
const output = await transcriber(url);
```

Note: Having a separate repo for ONNX weights is intended to be a temporary solution until WebML gains more traction. If you would like to make your models web-ready, we recommend converting to ONNX using [🤗 Optimum](https://huggingface.co/docs/optimum/index) and structuring your repo like this one (with ONNX weights located in a subfolder named `onnx`).