import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { FileUploadInput, MicrophoneInput } from ".";

export const AudioInputStep = ({ onNext }: { onNext: (audioData: Float32Array) => void }) => {
  const [source, setSource] = useState<"file" | "mic">("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessBlob = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      // Whisper needs 16kHz
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const float32Array = audioBuffer.getChannelData(0); // Mono channel
      onNext(float32Array);
    } catch (error) {
      console.error("Error processing audio", error);
      setErrorMsg("Failed to process audio. Please ensure the file is a valid audio format.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Select Audio Source</FieldLabel>
          <RadioGroup
            value={source}
            onValueChange={(val) => setSource(val as "file" | "mic")}
            className="mt-2 flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="file" id="source-file" />
              <Label htmlFor="source-file" className="font-normal">
                File Upload
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mic" id="source-mic" />
              <Label htmlFor="source-mic" className="font-normal">
                Microphone
              </Label>
            </div>
          </RadioGroup>
        </Field>
      </FieldGroup>

      {source === "file" && (
        <FileUploadInput onBlobReady={handleProcessBlob} disabled={isProcessing} />
      )}

      {source === "mic" && (
        <MicrophoneInput
          onBlobReady={handleProcessBlob}
          onError={setErrorMsg}
          disabled={isProcessing}
        />
      )}

      {isProcessing && <p className="text-muted-foreground text-sm">Processing audio...</p>}

      {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
    </div>
  );
};
