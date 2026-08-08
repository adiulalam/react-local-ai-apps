import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { FileUploadInput } from "./file-upload-input";
import { MicrophoneInput } from "./microphone-input";
import { Muted, P } from "@/components/ui/typography";
import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";
import { Button } from "@/components/ui/button";
import { ArrowRight, Volume2 } from "lucide-react";

import { useVoiceCloning } from "@/apps/voice-cloning/context/voice-cloning-context";

const VOICE_CLONING_SAMPLE_AUDIO: SampleMediaItem[] = [
  {
    name: "Reference Voice Recording",
    url: "/sample/voice-audio.wav",
    type: "audio",
    description: "Sample voice audio for cloning reference (~16kHz WAV)",
  },
];

export const AudioInputStep = () => {
  const { nextStep, updateState } = useVoiceCloning();
  const [source, setSource] = useState<"file" | "mic">("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAudioData, setSelectedAudioData] = useState<Float32Array | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const handleProcessBlob = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Array = audioBuffer.getChannelData(0);

      const previewUrl = URL.createObjectURL(blob);
      setSelectedAudioData(float32Array);
      setAudioPreviewUrl(previewUrl);
    } catch (error) {
      console.error("Error processing audio", error);
      setErrorMsg("Failed to process audio. Please ensure the file is a valid audio format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (selectedAudioData) {
      updateState({ audioData: selectedAudioData, audioUrl: audioPreviewUrl || undefined });
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Select Reference Voice Source</FieldLabel>
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
            items={VOICE_CLONING_SAMPLE_AUDIO}
            onSelectBlob={(blob) => handleProcessBlob(blob)}
            label="Or try the sample voice audio:"
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

      {errorMsg && <P className="text-destructive text-sm">{errorMsg}</P>}

      {selectedAudioData && (
        <div className="bg-card space-y-3 rounded-lg border p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="text-primary size-4" />
            <P className="text-sm font-medium not-first:mt-0">Reference Voice Audio Selected</P>
          </div>
          {audioPreviewUrl && (
            <audio controls src={audioPreviewUrl} className="h-10 w-full rounded-md" />
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={handleContinue}>
              Continue with this voice <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
