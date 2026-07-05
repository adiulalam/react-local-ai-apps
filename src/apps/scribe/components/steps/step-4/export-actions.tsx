import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";

interface ExportActionsProps {
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

export const ExportActions = ({ onCopy, onDownload, copied }: ExportActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onCopy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button size="sm" variant="secondary" onClick={onDownload}>
        <Download />
        Download
      </Button>
    </div>
  );
};
