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
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-2">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button size="sm" variant="secondary" onClick={onDownload} className="gap-2">
        <Download className="h-4 w-4" />
        Download
      </Button>
    </div>
  );
};
