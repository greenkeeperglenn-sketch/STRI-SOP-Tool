import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy HH:mm");
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function isReviewDue(reviewDate: Date | string | null | undefined, daysAhead = 30): boolean {
  if (!reviewDate) return false;
  const review = new Date(reviewDate);
  const threshold = addDays(new Date(), daysAhead);
  return isBefore(review, threshold);
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), new Date());
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateVersionNumber(existingVersions: number): string {
  return `${existingVersions + 1}.0`;
}

export const DEPARTMENTS = [
  "Operations",
  "Research",
  "Administration",
  "Field Operations",
  "Laboratory",
  "IT",
  "Finance",
  "Human Resources",
  "Safety & Compliance",
  "Communications",
] as const;

export const SOP_CATEGORIES = [
  "Safety",
  "Field Protocols",
  "Laboratory Procedures",
  "Administrative",
  "Emergency Response",
  "Data Management",
  "Equipment Operations",
  "Research Methods",
  "Training",
  "Environmental Compliance",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type SOPCategory = (typeof SOP_CATEGORIES)[number];
