import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '';
  
  try {
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'long',
    }).format(new Date(date));
  } catch (error) {
    console.error('Invalid date format:', date);
    return '';
  }
}

export function calculateAge(birthday: string | null): number | null {
  if (!birthday) return null;
  
  const birthDate = new Date(birthday);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}