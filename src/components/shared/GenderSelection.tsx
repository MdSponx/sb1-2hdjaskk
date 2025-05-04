import React from 'react';
import { type Gender } from '../../types/auth';
import { cn } from '../../lib/utils';

export const genderOptions: { value: Gender; label: string; description: string; emoji: string }[] = [
  { 
    value: 'male',
    label: 'ชาย',
    description: 'เกิดเป็นชายและระบุว่าเป็นชาย',
    emoji: '👨'
  },
  { 
    value: 'female',
    label: 'หญิง',
    description: 'เกิดเป็นหญิงและระบุว่าเป็นหญิง',
    emoji: '👩'
  },
  { 
    value: 'lgbtqm',
    label: 'LGBTQ+M',
    description: 'เพศกำเนิดชาย',
    emoji: '🌈'
  },
  { 
    value: 'lgbtqf',
    label: 'LGBTQ+F',
    description: 'เพศกำเนิดหญิง',
    emoji: '🌈'
  }
];

interface GenderSelectionProps {
  value?: Gender;
  onChange: (value: Gender) => void;
  className?: string;
}

export function GenderSelection({ value, onChange, className }: GenderSelectionProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {genderOptions.map((option) => (
        <label
          key={option.value}
          className="relative flex flex-col items-center"
        >
          <input
            type="radio"
            name="gender"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value as Gender)}
            className="sr-only"
          />
          <div className={cn(
            "w-full py-3 px-4 text-center rounded-lg cursor-pointer transition-colors",
            value === option.value
              ? "bg-brand-violet text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          )}>
            <span className="text-2xl mb-2 block">{option.emoji}</span>
            <span className="text-sm font-medium block">{option.label}</span>
            <span className="text-xs mt-1 block opacity-80">{option.description}</span>
          </div>
        </label>
      ))}
    </div>
  );
}