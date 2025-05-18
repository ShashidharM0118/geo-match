import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes properly.
 * This utility helps when conditionally applying classes or combining multiple class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
} 