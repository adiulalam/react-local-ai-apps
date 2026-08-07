import React, { createContext, useContext, useState } from "react";
import type { ClassificationResult } from "../utils/worker-message-handler";

interface ImageClassifierFormContextValue {
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  imageDataUrl: string | null;
  setImageDataUrl: (url: string | null) => void;
  results: ClassificationResult[] | null;
  setResults: (results: ClassificationResult[] | null) => void;
  caption: string | null;
  setCaption: (caption: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const ImageClassifierFormContext = createContext<ImageClassifierFormContextValue | undefined>(
  undefined
);

export const ImageClassifierFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult[] | null>(null);
  const [caption, setCaption] = useState<string | null>(null);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setActiveStep(1);
    setImageDataUrl(null);
    setResults(null);
    setCaption(null);
  };

  return (
    <ImageClassifierFormContext.Provider
      value={{
        activeStep,
        setActiveStep,
        imageDataUrl,
        setImageDataUrl,
        results,
        setResults,
        caption,
        setCaption,
        nextStep,
        prevStep,
        reset,
      }}
    >
      {children}
    </ImageClassifierFormContext.Provider>
  );
};

export const useImageClassifierFormContext = () => {
  const context = useContext(ImageClassifierFormContext);
  if (context === undefined) {
    throw new Error(
      "useImageClassifierFormContext must be used within an ImageClassifierFormProvider"
    );
  }
  return context;
};
