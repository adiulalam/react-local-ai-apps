import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const isTestEnv =
  import.meta.env.MODE === "test" ||
  import.meta.env.VITE_APP_ENV === "test" ||
  import.meta.env.VITE_APP_ENV === "TEST";
