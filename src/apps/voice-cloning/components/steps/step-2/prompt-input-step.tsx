import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Sparkles } from "lucide-react";
import { Muted, P, Small } from "@/components/ui/typography";

export interface VoiceCloningParams {
  text: string;
  exaggeration: number;
  temperature: number;
  repetitionPenalty: number;
}

interface PromptInputStepProps {
  initialValues?: VoiceCloningParams;
  onNext: (params: VoiceCloningParams) => void;
}

const SAMPLE_PROMPTS = [
  "Hello! This is a synthetic voice generated entirely in your browser using local AI.",
  "The quick brown fox jumps over the lazy dog. Welcome to local zero-shot voice cloning!",
  "Technology makes it possible to create natural and expressive speech right from your local device.",
];

export const PromptInputStep = ({ initialValues, onNext }: PromptInputStepProps) => {
  const [text, setText] = useState(
    initialValues?.text ||
      "Hello! This is a synthetic voice generated entirely in your browser using local AI."
  );
  const [exaggeration, setExaggeration] = useState(initialValues?.exaggeration ?? 0.5);
  const [temperature, setTemperature] = useState(initialValues?.temperature ?? 0.8);
  const [repetitionPenalty, setRepetitionPenalty] = useState(
    initialValues?.repetitionPenalty ?? 1.2
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onNext({
      text,
      exaggeration,
      temperature,
      repetitionPenalty,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="synthesis-text">Speech Text Prompt</Label>
        <Textarea
          id="synthesis-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to synthesize in the cloned voice..."
          className="min-h-28"
          maxLength={500}
        />
        <div className="flex justify-between text-xs">
          <Muted>Maximum ~500 characters per synthesis batch.</Muted>
          <Muted>{text.length}/500</Muted>
        </div>
      </div>

      <div className="space-y-2">
        <Small className="text-xs font-medium">Sample Prompts</Small>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setText(prompt)}
            >
              <Sparkles className="mr-1 size-3" />
              Sample {idx + 1}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card space-y-6 rounded-lg border p-4 shadow-xs">
        <P className="text-sm font-medium">Synthesis Parameters</P>

        {/* Emotion Exaggeration */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label htmlFor="exaggeration-slider" className="text-xs">
              Emotion Exaggeration: {exaggeration.toFixed(2)}
            </Label>
            <Muted className="text-xs">0.0 (Subtle) - 1.5 (Expressive)</Muted>
          </div>
          <Slider
            id="exaggeration-slider"
            value={[exaggeration]}
            min={0}
            max={1.5}
            step={0.05}
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              setExaggeration(num);
            }}
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label htmlFor="temperature-slider" className="text-xs">
              Temperature: {temperature.toFixed(2)}
            </Label>
            <Muted className="text-xs">0.1 (Focused) - 1.0 (Creative)</Muted>
          </div>
          <Slider
            id="temperature-slider"
            value={[temperature]}
            min={0.1}
            max={1.0}
            step={0.05}
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              setTemperature(num);
            }}
          />
        </div>

        {/* Repetition Penalty */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label htmlFor="repetition-slider" className="text-xs">
              Repetition Penalty: {repetitionPenalty.toFixed(2)}
            </Label>
            <Muted className="text-xs">1.0 (Default) - 2.0 (Strict)</Muted>
          </div>
          <Slider
            id="repetition-slider"
            value={[repetitionPenalty]}
            min={1.0}
            max={2.0}
            step={0.05}
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              setRepetitionPenalty(num);
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!text.trim()}>
          Generate Cloned Speech <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </form>
  );
};
