import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadProjectImage } from '../../lib/storage';
import { toast } from 'sonner';

interface FileUploaderProps {
  files: { name: string; url: string }[];
  onFilesChange: (files: { name: string; url: string }[]) => void;
  projectId?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/quicktime',
];

export function FileUploader({ files, onFilesChange, projectId }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error('รองรับไฟล์ PDF, DOC, DOCX, MP4 และ MOV เท่านั้น');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadProjectImage(file, projectId || 'temp');
      
      onFilesChange([...files, { name: file.name, url }]);
      toast.success('อัพโหลดไฟล์สำเร็จ');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('อัพโหลดไฟล์ไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2",
          "text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">กำลังอัพโหลด...</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8" />
            <span className="text-sm">คลิกเพื่ออัพโหลดไฟล์</span>
            <span className="text-xs text-gray-400">
              รองรับไฟล์ PDF, DOC, DOCX, MP4 และ MOV ขนาดไม่เกิน 10MB
            </span>
          </>
        )}
      </button>
    </div>
  );
}