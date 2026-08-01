import { describe, it, expect } from "vitest";
import { encodeWav } from "./wav-encoder";

describe("encodeWav", () => {
  it("should create a valid WAV Blob from Float32Array", async () => {
    const audioData = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const sampleRate = 24000;
    const blob = encodeWav(audioData, sampleRate);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + audioData.length * 2);

    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // Check RIFF header
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    expect(riff).toBe("RIFF");

    // Check WAVE header
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    expect(wave).toBe("WAVE");

    // Check sample rate
    expect(view.getUint32(24, true)).toBe(sampleRate);
  });
});
