import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MicrophoneInputProps {
  onBlobReady: (blob: Blob) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const MicrophoneInput = ({ onBlobReady, onError, disabled }: MicrophoneInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onBlobReady(blob);
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone permission denied or error", error);
      onError("Microphone permission denied or an error occurred.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="flex flex-col items-start gap-4">
      <Label>Record Audio</Label>
      {!isRecording ? (
        <Button onClick={startRecording} disabled={disabled}>
          Start Recording
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <div className="bg-destructive h-3 w-3 rounded-full" />
          <span className="text-sm font-medium">Recording...</span>
          <Button onClick={stopRecording} variant="destructive">
            Stop Recording
          </Button>
        </div>
      )}
    </div>
  );
};
