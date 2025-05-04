import React from 'react';

interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  description?: string;
}

export function FormLabel({ children, required = false, optional = false, description }: FormLabelProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 text-sm ml-2">(ไม่บังคับ)</span>}
      </label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}