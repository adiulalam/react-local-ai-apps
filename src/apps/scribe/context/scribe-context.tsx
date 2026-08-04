import React, { createContext, useContext, useState, type ReactNode } from "react";

export type ScribeState = {
  audioData?: Float32Array;
  transcription?: string;
  summary?: string;
};

type ScribeFormContextType = {
  formData: ScribeState;
  setFormData: React.Dispatch<React.SetStateAction<ScribeState>>;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setTranscription: (text: string) => void;
  setSummary: (text: string) => void;
};

const ScribeFormContext = createContext<ScribeFormContextType | undefined>(undefined);

export const useScribeFormContext = () => {
  const context = useContext(ScribeFormContext);
  if (!context) {
    throw new Error("useScribeFormContext must be used within a ScribeFormProvider");
  }
  return context;
};

const stepsCount = 4;

export const ScribeFormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ScribeState>({});
  const [activeStep, setActiveStep] = useState(1);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, stepsCount));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setFormData({});
    setActiveStep(1);
  };

  return (
    <ScribeFormContext.Provider
      value={{
        formData,
        setFormData,
        activeStep,
        setActiveStep,
        nextStep,
        prevStep,
        reset,
        setTranscription: (text) => setFormData((prev) => ({ ...prev, transcription: text })),
        setSummary: (text) => setFormData((prev) => ({ ...prev, summary: text })),
      }}
    >
      {children}
    </ScribeFormContext.Provider>
  );
};
