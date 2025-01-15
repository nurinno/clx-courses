import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | { seconds: number; nanoseconds: number; } | null | undefined) {
  if (!date) return "Not set"
  try {
    if ('seconds' in date) {
      return format(new Date(date.seconds * 1000), 'PP')
    }
    return format(date, 'PP')
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}