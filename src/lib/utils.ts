import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { clamp } from "es-toolkit";
import { useContext, type Context } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const lerp = ({
  start,
  end,
  time,
  timeOffset = 0,
  duration,
}: {
  start: number;
  end: number;
  time: number;
  timeOffset?: number;
  duration: number;
}) =>
  start +
  (end - start) * clamp((time - timeOffset) / (duration - timeOffset), 0, 1);

export const useRequiredContext = <T>(context: Context<T>) => {
  const value = useContext(context);
  if (!value) {
    throw new Error("Context not found");
  }
  return value;
};
