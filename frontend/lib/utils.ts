import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export const CHANNEL_LABELS: Record<string, string> = {
  phone: "Phone",
  whatsapp: "WhatsApp",
  web: "Web Chat",
  mobile: "Mobile App",
  email: "Email",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  cr: "Kreol",
  hi: "हिन्दी",
};
