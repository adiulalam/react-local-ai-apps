import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { FileUploadInput, MicrophoneInput } from ".";
import { Muted } from "@/components/ui/typography";
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";
import { useScribeContext } from "../../../context/scribe-context";

const SCRIBE_SAMPLE_AUDIO: SampleMediaItem[] = [
  {
    name: "10-Minute Speech Recording",
    url: "/sample/speech-10min.mp3",
    type: "audio",
    description: "~10 minutes • Spoken English",
  },
];

export const AudioInputStep = () => {
  const { processAudio, nextStep } = useScribeContext();
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
      
      processAudio(float32Array);
      nextStep();
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
        <div className="space-y-6">
          <FileUploadInput onBlobReady={handleProcessBlob} disabled={isProcessing} />
          <SampleMediaPicker
            items={SCRIBE_SAMPLE_AUDIO}
            onSelectBlob={(blob) => handleProcessBlob(blob)}
            label="Or try one of these sample audio recordings:"
          />
        </div>
      )}

      {source === "mic" && (
        <MicrophoneInput
          onBlobReady={handleProcessBlob}
          onError={setErrorMsg}
          disabled={isProcessing}
        />
      )}

      {isProcessing && <Muted>Processing audio...</Muted>}

      {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
    </div>
  );
};

