import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { VoiceCloningParams } from "@/apps/voice-cloning/components/steps/step-2";
import type { ProgressInfo } from "@/components/ui/download-progress";
import type { WorkerStatus } from "@/apps/voice-cloning/utils/worker-message-handler";
import VoiceCloningWorker from "@/apps/voice-cloning/workers/voice-cloning.worker?worker";
import { createWorkerMessageHandler } from "@/apps/voice-cloning/utils/worker-message-handler";
import { encodeWav } from "@/apps/voice-cloning/utils/wav-encoder";

export type VoiceCloningState = {
  audioData?: Float32Array;
  audioUrl?: string;
  params?: VoiceCloningParams;
  audioBlob?: Blob;
  samplingRate?: number;
};

type VoiceCloningContextType = {
  activeStep: number;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  state: VoiceCloningState;
  updateState: (updates: Partial<VoiceCloningState>) => void;

  workerStatus: WorkerStatus;
  progressItems: Record<string, ProgressInfo>;
  statusText: string;
  progressPercent: number;
  errorMessage: string | null;

  generateVoice: () => Promise<{ audioBlob: Blob; samplingRate: number }>;
};

const VoiceCloningContext = createContext<VoiceCloningContextType | null>(null);

export const useVoiceCloning = () => {
  const context = useContext(VoiceCloningContext);
  if (!context) {
    throw new Error("useVoiceCloning must be used within a VoiceCloningProvider");
  }
  return context;
};

export const VoiceCloningProvider = ({ children }: { children: ReactNode }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [state, setState] = useState<VoiceCloningState>({});

  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>("idle");
  const [progressItems, setProgressItems] = useState<Record<string, ProgressInfo>>({});
  const [statusText, setStatusText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const requestRef = useRef<{
    audioData: Float32Array;
    params: VoiceCloningParams;
    resolve: (val: { audioBlob: Blob; samplingRate: number }) => void;
    reject: (err: Error) => void;
  } | null>(null);

  useEffect(() => {
    const worker = new VoiceCloningWorker();
    workerRef.current = worker;

    const handler = createWorkerMessageHandler({
      setStatus: setWorkerStatus,
      setProgressItems,
      setStatusText,
      setProgressPercent,
      onReady: () => {
        setModelLoaded(true);
        if (requestRef.current) {
          worker.postMessage({
            type: "encode_speaker",
            data: { id: "user", audioData: requestRef.current.audioData },
          });
        }
      },
      onSpeakerEncoded: () => {
        if (requestRef.current) {
          worker.postMessage({
            type: "generate",
            data: {
              text: requestRef.current.params.text,
              speakerId: "user",
              exaggeration: requestRef.current.params.exaggeration,
            },
          });
        }
      },
      onComplete: (generatedAudioData, samplingRate) => {
        const wavBlob = encodeWav(generatedAudioData, samplingRate);
        if (requestRef.current) {
          requestRef.current.resolve({ audioBlob: wavBlob, samplingRate });
          requestRef.current = null;
        }
      },
      setErrorMsg: (msg) => {
        setErrorMessage(msg);
        if (requestRef.current) {
          requestRef.current.reject(new Error(msg));
          requestRef.current = null;
        }
      },
    });

    worker.addEventListener("message", handler);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const reset = () => {
    setState({});
    setActiveStep(1);
    setWorkerStatus("idle");
    setProgressItems({});
    setStatusText("");
    setProgressPercent(0);
    setErrorMessage(null);
  };

  const updateState = (updates: Partial<VoiceCloningState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const generateVoice = () => {
    return new Promise<{ audioBlob: Blob; samplingRate: number }>((resolve, reject) => {
      if (!state.audioData || !state.params) {
        reject(new Error("Missing audio data or parameters"));
        return;
      }

      setErrorMessage(null);
      requestRef.current = { audioData: state.audioData, params: state.params, resolve, reject };

      if (modelLoaded) {
        workerRef.current?.postMessage({
          type: "encode_speaker",
          data: { id: "user", audioData: state.audioData },
        });
      } else {
        workerRef.current?.postMessage({ type: "load", data: {} });
      }
    });
  };

  return (
    <VoiceCloningContext.Provider
      value={{
        activeStep,
        nextStep,
        prevStep,
        reset,
        state,
        updateState,
        workerStatus,
        progressItems,
        statusText,
        progressPercent,
        errorMessage,
        generateVoice,
      }}
    >
      {children}
    </VoiceCloningContext.Provider>
  );
};
