export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export class AudioNarrationPlayer {
  private isSpeaking = false;

  speak = (text: string, options?: SpeechOptions): void => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Cancel existing speech before speaking new description to avoid long delayed queues
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = options?.lang ?? "en-US";

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
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
