import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ProgressInfo } from "@/components/ui/download-progress";
import {
  createWorkerMessageHandler,
  type WorkerStatus,
  type ClassificationResult,
} from "../utils/worker-message-handler";
import ImageClassificationWorker from "@/apps/image-classifier/workers/image-classification.worker?worker";
import ImageCaptioningWorker from "@/apps/image-classifier/workers/image-captioning.worker?worker";

interface ImageClassifierContextValue {
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  imageDataUrl: string | null;
  setImageDataUrl: (url: string | null) => void;
  results: ClassificationResult[] | null;
  caption: string | null;

  classificationStatus: WorkerStatus;
  classificationError: string;
  classificationProgress: Record<string, ProgressInfo>;
  classifyImage: (url: string) => void;

  captionStatus: WorkerStatus;
  captionError: string;
  captionProgress: Record<string, ProgressInfo>;
  generateCaption: (url: string) => void;

  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const ImageClassifierContext = createContext<ImageClassifierContextValue | undefined>(undefined);

export const ImageClassifierProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const [results, setResults] = useState<ClassificationResult[] | null>(null);
  const [classificationStatus, setClassificationStatus] = useState<WorkerStatus>("initializing");
  const [classificationError, setClassificationError] = useState("");
  const [classificationProgress, setClassificationProgress] = useState<
    Record<string, ProgressInfo>
  >({});

  const [caption, setCaption] = useState<string | null>(null);
  const [captionStatus, setCaptionStatus] = useState<WorkerStatus>("initializing");
  const [captionError, setCaptionError] = useState("");
  const [captionProgress, setCaptionProgress] = useState<Record<string, ProgressInfo>>({});

  const classificationWorkerRef = useRef<Worker | null>(null);
  const captionWorkerRef = useRef<Worker | null>(null);

  const pendingClassification = useRef<string | null>(null);
  const pendingCaption = useRef<string | null>(null);

  useEffect(() => {
    classificationWorkerRef.current = new ImageClassificationWorker();
    const classMessageHandler = createWorkerMessageHandler({
      setStatus: setClassificationStatus,
      setProgressItems: setClassificationProgress,
      onReady: () => {
        if (pendingClassification.current && classificationWorkerRef.current) {
          classificationWorkerRef.current.postMessage({
            type: "process",
            image: pendingClassification.current,
          });
          pendingClassification.current = null;
        }
      },
      onComplete: (res) => setResults(res),
      setErrorMsg: setClassificationError,
    });
    classificationWorkerRef.current.addEventListener("message", classMessageHandler);

    captionWorkerRef.current = new ImageCaptioningWorker();
    const capMessageHandler = createWorkerMessageHandler<string>({
      setStatus: setCaptionStatus,
      setProgressItems: setCaptionProgress,
      onReady: () => {
        if (pendingCaption.current && captionWorkerRef.current) {
          captionWorkerRef.current.postMessage({ type: "process", image: pendingCaption.current });
          pendingCaption.current = null;
        }
      },
      onComplete: (res) => setCaption(res),
      setErrorMsg: setCaptionError,
    });
    captionWorkerRef.current.addEventListener("message", capMessageHandler);

    return () => {
      classificationWorkerRef.current?.terminate();
      classificationWorkerRef.current = null;
      captionWorkerRef.current?.terminate();
      captionWorkerRef.current = null;
    };
  }, []);

  const classifyImage = (url: string) => {
    setImageDataUrl(url);
    if (classificationWorkerRef.current) {
      pendingClassification.current = url;
      setClassificationStatus("loading");
      classificationWorkerRef.current.postMessage({ type: "load" });
    }
  };

  const generateCaption = (url: string) => {
    if (captionWorkerRef.current) {
      pendingCaption.current = url;
      setCaptionStatus("loading");
      captionWorkerRef.current.postMessage({ type: "load" });
    }
  };

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setActiveStep(1);
    setImageDataUrl(null);
    setResults(null);
    setCaption(null);
    setClassificationStatus("initializing");
    setCaptionStatus("initializing");
  };

  return (
    <ImageClassifierContext.Provider
      value={{
        activeStep,
        setActiveStep,
        imageDataUrl,
        setImageDataUrl,
        results,
        caption,
        classificationStatus,
        classificationError,
        classificationProgress,
        classifyImage,
        captionStatus,
        captionError,
        captionProgress,
        generateCaption,
        nextStep,
        prevStep,
        reset,
      }}
    >
      {children}
    </ImageClassifierContext.Provider>
  );
};

export const useImageClassifier = () => {
  const context = useContext(ImageClassifierContext);
  if (context === undefined) {
    throw new Error("useImageClassifier must be used within an ImageClassifierProvider");
  }
  return context;
};
