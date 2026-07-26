import { SampleMediaPicker, type SampleMediaItem } from "@/components/sample-media-picker";

export const SAMPLE_TEXT_ITEMS: SampleMediaItem[] = [
  {
    name: "80s Synthwave",
    type: "text",
    description: "Synthwave",
    text: "80s synthwave pop track with energetic drums, retro bassline, and catchy arpeggiated synths",
  },
  {
    name: "Lo-Fi Beats",
    type: "text",
    description: "Lo-Fi",
    text: "Relaxing lo-fi chill hop beat with acoustic piano, mellow vinyl crackle, and smooth bass",
  },
  {
    name: "Cinematic Trailer",
    type: "text",
    description: "Orchestral",
    text: "Epic cinematic film score with heavy brass, intense strings, dramatic choir, and trailer drums",
  },
  {
    name: "Groovy Funk",
    type: "text",
    description: "Funk",
    text: "Upbeat 70s funk track with a funky bassline, rhythmic electric guitar stabs, and brass stabs",
  },
  {
    name: "Ambient Soundscape",
    type: "text",
    description: "Ambient",
    text: "Calm atmospheric ambient soundscape with soothing synth pads, gentle acoustic guitar, and ocean breeze",
  },
  {
    name: "EDM Drop",
    type: "text",
    description: "Electronic",
    text: "High-energy electro house dance track with punchy kick drum, rising synth buildup, and heavy bass drop",
  },
];

type SamplePromptsProps = {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
};

export const SamplePrompts = ({ onSelectPrompt }: SamplePromptsProps) => {
  return (
    <SampleMediaPicker
      items={SAMPLE_TEXT_ITEMS}
      variant="chips"
      label="Sample Presets:"
      onSelectText={(text) => onSelectPrompt(text)}
    />
  );
};
