import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked = false, onCheckedChange, className, label, disabled = false }: CheckboxProps) {
  return (
    <label className={cn(
      "inline-flex items-center gap-2 cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      <div
        role="checkbox"
        aria-checked={checked}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
          checked ? "bg-brand-violet border-brand-violet" : "bg-white border-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-brand-violet focus:ring-offset-2",
          disabled && "cursor-not-allowed"
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      {label && <span className="select-none">{label}</span>}
    </label>
  );
}