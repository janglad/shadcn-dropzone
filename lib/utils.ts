import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const roundUpTo = (num: number, decimals: number) => {
  return Math.ceil(num * 10 ** decimals) / 10 ** decimals;
};
