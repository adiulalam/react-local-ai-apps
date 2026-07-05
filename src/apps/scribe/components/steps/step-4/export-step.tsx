import { ExportBlock } from "./export-block";

interface ExportStepProps {
  transcription?: string;
  summary?: string;
}

export const ExportStep = ({ transcription, summary }: ExportStepProps) => {
  if (!transcription && !summary) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        No transcription or summary data available to export.
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
