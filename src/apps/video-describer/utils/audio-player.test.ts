import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AudioNarrationPlayer } from "./audio-player";

describe("AudioNarrationPlayer", () => {
  let player: AudioNarrationPlayer;
  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSpeak = vi.fn();
    mockCancel = vi.fn();

    class MockSpeechSynthesisUtterance {
      text: string;
      rate = 1.0;
      pitch = 1.0;
      volume = 1.0;
      lang = "en-US";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal("window", {
      speechSynthesis: {
        speak: mockSpeak,
        cancel: mockCancel,
      },
    });

    vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);

    player = new AudioNarrationPlayer();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should cancel existing speech and speak new text", () => {
    player.speak("A cute dog in the park");

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it("should not speak if text is empty or whitespace", () => {
    player.speak("   ");

    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it("should stop speaking when stop is called", () => {
    player.stop();

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(player.getSpeakingStatus()).toBe(false);
  });
});
