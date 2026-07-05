import { useState } from "react";
import { ExportActions } from "./export-actions";

interface ExportBlockProps {
  title: string;
  content: string;
  prefix: string;
}

export const ExportBlock = ({ title, content, prefix }: ExportBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `local_scribe_${prefix}_${new Date().getTime()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ExportActions onCopy={handleCopy} onDownload={handleDownload} copied={copied} />
      </div>
      <div className="bg-secondary/20 max-h-64 overflow-y-auto rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};
