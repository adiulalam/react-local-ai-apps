import { describe, it, expect } from "vitest";
import { encodeWav } from "./wav-encoder";

describe("encodeWav", () => {
  it("should create a valid WAV blob from Float32Array", async () => {
    const sampleRate = 32000;
    const audioData = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const blob = encodeWav(audioData, sampleRate);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/wav");

    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Verify RIFF header
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    expect(riff).toBe("RIFF");

    // Verify WAVE header
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    expect(wave).toBe("WAVE");

    // Verify sample rate at offset 24
    expect(view.getUint32(24, true)).toBe(sampleRate);
  });
});
