import { useState, useTransition } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { H3, H4, Muted, Small } from "@/components/ui/typography";
import { useSemanticSearchContext } from "@/apps/semantic-search/context/semantic-search-context";
import { parseFileContent } from "@/apps/semantic-search/utils/document-parser";
import { chunkText } from "@/apps/semantic-search/utils/text-chunker";
import {
  SAMPLE_DOCUMENTS,
  type SampleDocumentItem,
} from "@/apps/semantic-search/utils/sample-documents";

export const DocumentInputStep = () => {
  const { formData, setFormData, nextStep } = useSemanticSearchContext();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [pastedText, setPastedText] = useState(formData.documentText || "");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedSampleName, setSelectedSampleName] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);
    setSelectedSampleName(null);

    try {
      const parsed = await parseFileContent(file);
      if (!parsed.text.trim()) {
        throw new Error("No readable text could be extracted from this document.");
      }

      const generatedChunks = chunkText(parsed.text, formData.chunkingOptions);

      setFormData((prev) => ({
        ...prev,
        documentName: parsed.name,
        documentType: parsed.type,
        documentSize: parsed.size,
        documentText: parsed.text,
        pageCount: parsed.pageCount,
        chunks: generatedChunks,
        chunkEmbeddings: [],
        searchResults: [],
        searchQuery: "",
      }));
      setPastedText(parsed.text);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse document");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    setSelectedSampleName(null);
    setParseError(null);

    startTransition(() => {
      const generatedChunks = chunkText(text, formData.chunkingOptions);
      setFormData((prev) => ({
        ...prev,
        documentName: text.trim() ? "Pasted Document" : "",
        documentType: "text",
        documentText: text,
        chunks: generatedChunks,
        chunkEmbeddings: [],
        searchResults: [],
      }));
    });
  };

  const handleSelectSample = (sample: SampleDocumentItem) => {
    setSelectedSampleName(sample.name);
    setPastedText(sample.text);
    setParseError(null);

    const generatedChunks = chunkText(sample.text, formData.chunkingOptions);
    setFormData((prev) => ({
      ...prev,
      documentName: sample.name,
      documentType: "sample",
      documentText: sample.text,
      chunks: generatedChunks,
      chunkEmbeddings: [],
      searchResults: [],
      searchQuery: sample.sampleQueries[0] || "",
    }));
  };

  const totalWords = formData.documentText
    ? formData.documentText.split(/\s+/).filter(Boolean).length
    : 0;

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="size-5 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="size-5 text-blue-500" />;
      case "csv":
      case "tsv":
        return <FileSpreadsheet className="size-5 text-emerald-500" />;
      case "json":
      case "md":
        return <FileCode className="size-5 text-amber-500" />;
      default:
        return <FileText className="text-primary size-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <H3>Choose Your Document</H3>
        <Muted>
          Upload a file, paste text, or pick a sample. Everything stays 100% on your device.
        </Muted>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="size-4" />
            <span>Upload File</span>
          </TabsTrigger>
          <TabsTrigger value="paste" className="gap-2">
            <FileText className="size-4" />
            <span>Paste Text</span>
          </TabsTrigger>
          <TabsTrigger value="samples" className="gap-2">
            <Sparkles className="size-4" />
            <span>Sample Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Upload File */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          <label className="border-border/80 bg-background/50 hover:border-primary/60 hover:bg-muted/40 group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.markdown,.json,.csv,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-3 flex size-12 items-center justify-center rounded-full transition-colors">
              <Upload className="size-6" />
            </div>
            <H4 className="font-semibold">Click or Drag & Drop File</H4>
            <Muted className="mt-1 max-w-sm text-xs">
              Supports <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, Markdown (.md),
              Text (.txt), CSV (.csv), and JSON (.json).
            </Muted>
          </label>

          {isParsing && (
            <div className="bg-muted/50 flex items-center justify-center gap-2 rounded-lg p-4">
              <Sparkles className="text-primary size-4 animate-spin" />
              <Small>Reading and extracting document text...</Small>
            </div>
          )}

          {parseError && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Paste Text */}
        <TabsContent value="paste" className="mt-4 space-y-3">
          <Textarea
            placeholder="Paste text from articles, Google Docs, meeting notes, or PDFs here..."
            value={pastedText}
            onChange={(e) => handlePastedTextChange(e.target.value)}
            className="min-h-48 resize-y font-mono text-sm leading-relaxed"
          />
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Info className="size-3.5" />
              <span>Tip: You can paste content directly from Google Docs or web articles.</span>
            </div>
            <span>
              {pastedText.length.toLocaleString()} chars • {totalWords.toLocaleString()} words
            </span>
          </div>
        </TabsContent>

        {/* Tab 3: Sample Documents */}
        <TabsContent value="samples" className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SAMPLE_DOCUMENTS.map((sample) => {
              const isSelected = selectedSampleName === sample.name;
              return (
                <Card
                  key={sample.name}
                  onClick={() => handleSelectSample(sample)}
                  className={`hover:border-primary/60 cursor-pointer transition-all hover:shadow-xs ${
                    isSelected ? "border-primary bg-primary/5 ring-primary ring-1" : "bg-card"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {sample.category}
                      </Badge>
                      {isSelected && <CheckCircle2 className="text-primary size-4" />}
                    </div>
                    <CardTitle className="mt-2 text-sm font-semibold">{sample.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription className="line-clamp-2 text-xs">
                      {sample.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Document Confirmation & Next Action */}
      {formData.documentText.trim() && (
        <Card className="bg-secondary/30 border-border/70">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-background flex size-10 items-center justify-center rounded-lg border shadow-xs">
                {getFileIcon(formData.documentType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <H4 className="text-sm font-semibold">
                    {formData.documentName || "Selected Document"}
                  </H4>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {formData.documentType}
                  </Badge>
                </div>
                <Muted className="text-xs">
                  {totalWords.toLocaleString()} words • {formData.chunks.length} sections extracted
                  {formData.pageCount ? ` • ${formData.pageCount} pages` : ""}
                </Muted>
              </div>
            </div>

            <Button onClick={nextStep} className="gap-2" size="default">
              <span>Start Search & Chat</span>
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
