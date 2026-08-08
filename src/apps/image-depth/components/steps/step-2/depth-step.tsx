import { useState, useEffect, useCallback } from "react";
import { Download, Eye, ArrowRightLeft } from "lucide-react";
import { DownloadProgress } from "@/components/ui/download-progress";
import { H3, Muted, Small } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { type DepthResult } from "@/apps/image-depth/utils/worker-message-handler";
import { useImageDepth } from "@/apps/image-depth/context/image-depth-context";

type ColormapType = "inferno" | "viridis" | "plasma" | "turbo" | "grayscale" | "spectral";

const getColormapRGB = (
  val: number,
  cmap: ColormapType,
  invert: boolean
): [number, number, number] => {
  const v = invert ? 255 - val : val;
  const t = Math.max(0, Math.min(1, v / 255));

  switch (cmap) {
    case "inferno": {
      const r = Math.min(255, Math.max(0, Math.round(255 * Math.pow(t, 0.7) * 1.2)));
      const g = Math.min(255, Math.max(0, Math.round(255 * Math.pow(t, 1.8) * 1.1)));
      const b = Math.min(
        255,
        Math.max(
          0,
          Math.round(
            255 * (t < 0.5 ? Math.pow(t * 2, 3) * 0.4 : (1 - Math.pow((1 - t) * 2, 2)) * 0.8 + 0.2)
          )
        )
      );
      return [r, g, b];
    }
    case "viridis": {
      const r = Math.round(255 * (0.28 + 0.7 * t * Math.sin(t * Math.PI)));
      const g = Math.round(255 * (0.15 + 0.8 * Math.pow(t, 0.8)));
      const b = Math.round(255 * (0.47 + 0.5 * (1 - t)));
      return [
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
      ];
    }
    case "plasma": {
      const r = Math.round(255 * Math.sin(t * Math.PI * 0.7));
      const g = Math.round(255 * Math.pow(t, 2));
      const b = Math.round(255 * (0.6 - 0.5 * t));
      return [
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
      ];
    }
    case "turbo": {
      const r = Math.round(255 * Math.sin(t * Math.PI * 0.9));
      const g = Math.round(255 * Math.sin((t + 0.3) * Math.PI * 0.9));
      const b = Math.round(255 * Math.cos(t * Math.PI * 0.5));
      return [
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
      ];
    }
    case "spectral": {
      const r = Math.round(255 * (1 - t));
      const g = Math.round(255 * Math.sin(t * Math.PI));
      const b = Math.round(255 * t);
      return [
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
      ];
    }
    case "grayscale":
    default:
      return [v, v, v];
  }
};

export const DepthStep = () => {
  const { formData, status, errorMsg, progressItems, rawDepth, processImage } = useImageDepth();
  const imageDataUrl = formData.imageDataUrl;

  const [colormap, setColormap] = useState<ColormapType>("inferno");
  const [invert, setInvert] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const renderDepthCanvas = useCallback(
    (depthData: DepthResult, cmap: ColormapType, inv: boolean) => {
      const { data, width, height } = depthData;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imgData = ctx.createImageData(width, height);
      const pixels = imgData.data;

      for (let i = 0; i < data.length; i++) {
        const val = data[i];
        const [r, g, b] = getColormapRGB(val, cmap, inv);
        const idx = i * 4;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);
      setResultImage(canvas.toDataURL("image/png"));
    },
    []
  );

  useEffect(() => {
    if (imageDataUrl && status === "idle") {
      processImage(imageDataUrl);
    }
  }, [imageDataUrl, status, processImage]);

  useEffect(() => {
    if (rawDepth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      renderDepthCanvas(rawDepth, colormap, invert);
    }
  }, [rawDepth, colormap, invert, renderDepthCanvas]);

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = "depth-map.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!imageDataUrl) {
    return (
      <Muted className="text-destructive">
        No image data provided. Please ensure Step 1 completed successfully.
      </Muted>
    );
  }

  return (
    <div className="space-y-4">
      <DownloadProgress progressItems={progressItems} />

      {status === "initializing" && <Muted>Initializing Web Worker...</Muted>}

      {status === "loading" && (
        <Muted>Downloading Depth Anything model... This only happens once.</Muted>
      )}

      {status === "processing" && (
        <div className="flex items-center gap-3">
          <Spinner className="text-muted-foreground" />
          <Muted>Estimating depth map... This may take a moment.</Muted>
        </div>
      )}

      {status === "error" && <Muted className="text-destructive">{errorMsg}</Muted>}

      {status === "complete" && resultImage && (
        <div className="space-y-6">
          <div className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Eye className="text-primary h-4 w-4" />
              <Small>Color Palette:</Small>
              <NativeSelect
                value={colormap}
                onChange={(e) => setColormap(e.target.value as ColormapType)}
                size="sm"
              >
                <NativeSelectOption value="inferno">Inferno</NativeSelectOption>
                <NativeSelectOption value="viridis">Viridis</NativeSelectOption>
                <NativeSelectOption value="plasma">Plasma</NativeSelectOption>
                <NativeSelectOption value="turbo">Turbo</NativeSelectOption>
                <NativeSelectOption value="spectral">Spectral</NativeSelectOption>
                <NativeSelectOption value="grayscale">Grayscale</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="flex items-center gap-2">
              <ArrowRightLeft className="text-muted-foreground h-4 w-4" />
              <Small>Invert Depth:</Small>
              <Switch checked={invert} onCheckedChange={setInvert} />
            </div>

            <Button onClick={handleDownload} variant="default" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Depth PNG
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <H3>Original Image</H3>
              <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
                <img
                  src={imageDataUrl}
                  alt="Original"
                  className="max-h-80 rounded-md object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <H3>Depth Map ({colormap})</H3>
              <div className="bg-background flex items-center justify-center overflow-hidden rounded-lg border p-2">
                <img
                  src={resultImage}
                  alt="Depth Map"
                  className="max-h-80 rounded-md object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
