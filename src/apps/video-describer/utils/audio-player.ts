export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export class AudioNarrationPlayer {
  private isSpeaking = false;

  speak = (text: string, options?: SpeechOptions): void => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options?.onEnd?.();
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      options?.onEnd?.();
      return;
    }

    // Cancel existing speech before speaking new description
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    utterance.rate = options?.rate ?? 1.15;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = options?.lang ?? "en-US";

    utterance.onstart = () => {
      this.isSpeaking = true;
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  stop = (): void => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  };

  getSpeakingStatus = (): boolean => {
    return this.isSpeaking;
  };
}

export const audioPlayer = new AudioNarrationPlayer();
