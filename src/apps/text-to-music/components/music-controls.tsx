import { Sliders, Clock, Compass, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Muted, Small } from "@/components/ui/typography";

export type MusicControlsState = {
  duration: number;
  guidanceScale: number;
  temperature: number;
};

type MusicControlsProps = {
  values: MusicControlsState;
  onChange: (updates: Partial<MusicControlsState>) => void;
  disabled?: boolean;
};

export const MusicControls = ({ values, onChange, disabled = false }: MusicControlsProps) => {
  return (
    <div className="bg-muted/20 space-y-6 rounded-lg border p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <Sliders className="text-primary size-4" />
        <Small className="text-sm font-semibold">Generation Parameters</Small>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Duration Control */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label id="duration-label" className="flex items-center gap-1.5 text-xs font-medium">
              <Clock className="text-muted-foreground size-3.5" />
              Duration: <span className="text-primary font-bold">{values.duration}s</span>
            </Label>
          </div>
          <Slider
            value={[values.duration]}
            min={1}
            max={30}
            step={1}
            disabled={disabled}
            aria-label="Duration"
            aria-labelledby="duration-label"
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              onChange({ duration: num });
            }}
          />
          <Muted className="block text-[11px] leading-tight">
            Length of the generated audio track. Longer duration requires more computation time.
          </Muted>
        </div>

        {/* Guidance Scale Control */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label
              id="guidance-scale-label"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <Compass className="text-muted-foreground size-3.5" />
              Guidance Scale:{" "}
              <span className="text-primary font-bold">{values.guidanceScale.toFixed(1)}</span>
            </Label>
          </div>
          <Slider
            value={[values.guidanceScale]}
            min={1.0}
            max={10.0}
            step={0.5}
            disabled={disabled}
            aria-label="Guidance Scale"
            aria-labelledby="guidance-scale-label"
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              onChange({ guidanceScale: num });
            }}
          />
          <Muted className="block text-[11px] leading-tight">
            Controls prompt adherence. Higher values follow prompt strictly; lower allows freedom.
          </Muted>
        </div>

        {/* Temperature Control */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label id="temperature-label" className="flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="text-muted-foreground size-3.5" />
              Temperature:{" "}
              <span className="text-primary font-bold">{values.temperature.toFixed(1)}</span>
            </Label>
          </div>
          <Slider
            value={[values.temperature]}
            min={0.1}
            max={2.0}
            step={0.1}
            disabled={disabled}
            aria-label="Temperature"
            aria-labelledby="temperature-label"
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : val;
              onChange({ temperature: num });
            }}
          />
          <Muted className="block text-[11px] leading-tight">
            Sampling randomness. Higher values produce creative variance; lower produces
            deterministic audio.
          </Muted>
        </div>
      </div>
    </div>
  );
};
