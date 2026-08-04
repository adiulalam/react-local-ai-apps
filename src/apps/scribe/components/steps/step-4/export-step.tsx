import { ExportBlock } from "./export-block";
import { Muted } from "@/components/ui/typography";
import { useScribeFormContext } from "../../../context/scribe-context";

export const ExportStep = () => {
  const { formData } = useScribeFormContext();
  const { transcription, summary } = formData;

  if (!transcription && !summary) {
    return (
      <div className="p-8 text-center">
        <Muted>No transcription or summary data available to export.</Muted>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {summary && <ExportBlock title="Final Summary" content={summary} prefix="summary" />}

      {transcription && (
        <ExportBlock title="Raw Transcription" content={transcription} prefix="transcription" />
      )}
    </div>
  );
};
