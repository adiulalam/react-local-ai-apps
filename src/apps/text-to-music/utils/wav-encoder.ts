export const encodeWav = (audioData: Float32Array, sampleRate: number): Blob => {
  const numChannels = 1;
  const bitsPerSample = 32; // 32-bit IEEE Float PCM
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = audioData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(8, "WAVE");

  /* Format chunk identifier */
  writeString(12, "fmt ");
  /* Format chunk length (16 for PCM/Float) */
  view.setUint32(16, 16, true);
  /* Audio format (3 = IEEE Float PCM) */
  view.setUint16(20, 3, true);
  /* Channel count */
  view.setUint16(22, numChannels, true);
  /* Sample rate */
  view.setUint32(24, sampleRate, true);
  /* Byte rate */
  view.setUint32(28, byteRate, true);
  /* Block align */
  view.setUint16(32, blockAlign, true);
  /* Bits per sample */
  view.setUint16(34, bitsPerSample, true);

  /* Data chunk identifier */
  writeString(36, "data");
  /* Data chunk length */
  view.setUint32(40, dataSize, true);

  /* Write 32-bit IEEE Float PCM samples */
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    view.setFloat32(offset, audioData[i], true);
    offset += 4;
  }

  return new Blob([buffer], { type: "audio/wav" });
};
