import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SummaryMode, SUMMARY_OPTIONS } from "@/types/summary";

interface ModeSelectorProps {
  mode: SummaryMode;
  onModeChange: (mode: SummaryMode) => void;
  onGenerate: () => void;
}

export const ModeSelector = ({ mode, onModeChange, onGenerate }: ModeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Select Summary Length</Label>
        <Select value={mode} onValueChange={(val) => onModeChange(val as SummaryMode)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a mode" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUMMARY_OPTIONS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button onClick={onGenerate}>Generate Summary</Button>
      </div>
    </div>
  );
};
