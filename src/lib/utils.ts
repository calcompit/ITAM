import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Thailand time string (UTC+7)
export function formatThailandTime(utcDate: string | Date): string {
  const date = new Date(utcDate);
  // Convert to Thailand timezone (UTC+7)
  const thailandTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return thailandTime.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Bangkok'
  });
}

// Format date with relative time (Today, Yesterday, etc.)
export function formatRelativeTime(utcDate: string | Date): string {
  const date = new Date(utcDate);
  // Convert to Thailand timezone for comparison
  const thailandDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  const now = new Date();
  const thailandNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  const diffInMs = thailandNow.getTime() - thailandDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Check if same day in Thailand timezone
  const isToday = thailandDate.toDateString() === thailandNow.toDateString();
  const isYesterday = thailandDate.toDateString() === new Date(thailandNow.getTime() - 24 * 60 * 60 * 1000).toDateString();
  
  if (isToday) {
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${diffInHours}h ago`;
  } else if (isYesterday) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return thailandDate.toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Bangkok'
    });
  }
}
