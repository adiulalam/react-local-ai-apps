import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SamplePrompts } from "@/apps/text-to-music/components/sample-prompts";
import {
  MusicControls,
  type MusicControlsState,
} from "@/apps/text-to-music/components/music-controls";

import { useTextToMusic } from "@/apps/text-to-music/context/text-to-music-context";

export type GenerationParams = {
  prompt: string;
  duration: number;
  guidanceScale: number;
  temperature: number;
};

export const PromptInputStep = () => {
  const { formData, process } = useTextToMusic();
  const initialValues = formData.params;
  const [prompt, setPrompt] = useState(initialValues?.prompt || "");
  const [controls, setControls] = useState<MusicControlsState>({
    duration: initialValues?.duration || 10,
    guidanceScale: initialValues?.guidanceScale || 3.0,
    temperature: initialValues?.temperature || 1.0,
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    process({
      prompt: prompt.trim(),
      duration: controls.duration,
      guidanceScale: controls.guidanceScale,
      temperature: controls.temperature,
    });
  };

  return (
    <div className="space-y-6">
      {/* Prompt Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Text Prompt</Label>
          {prompt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrompt("")}
              className="text-muted-foreground h-6 px-2 text-xs"
            >
              <X className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>

        <Textarea
          placeholder="Describe the music you want to generate (e.g. '80s synthwave pop track with energetic drums and retro synths')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />

        {/* Sample Presets */}
        <SamplePrompts onSelectPrompt={(selected) => setPrompt(selected)} />
      </div>

      {/* Music Controls */}
      <MusicControls
        values={controls}
        onChange={(updates) => setControls((prev) => ({ ...prev, ...updates }))}
      />

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          variant="default"
          size="lg"
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="gap-2 px-6 font-medium"
        >
          <Sparkles className="size-4" />
          Generate Music
        </Button>
      </div>
    </div>
  );
};
