import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimeAgo = (value: string) => formatDistanceToNow(parseISO(value), { addSuffix: true });
