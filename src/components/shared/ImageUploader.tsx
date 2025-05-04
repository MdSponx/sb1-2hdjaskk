import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadProjectImage, deleteProjectImage } from '../../lib/storage';
import { toast } from 'sonner';

interface ImageUploaderProps {
  imageUrl: string | undefined;
  onImageChange: (url: string) => void;
  projectId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ImageUploader({ imageUrl, onImageChange, projectId }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('รองรับไฟล์ภาพ JPG, PNG และ WebP เท่านั้น');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadProjectImage(file, projectId || 'temp');
      
      if (imageUrl) {
        await deleteProjectImage(imageUrl);
      }
      
      onImageChange(url);
      toast.success('อัพโหลดรูปภาพสำเร็จ');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('อัพโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      setIsUploading(true);
      await deleteProjectImage(imageUrl);
      onImageChange('');
      toast.success('ลบรูปภาพสำเร็จ');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('ลบรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleImageChange}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Project"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2",
            "text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-8 h-8" />
          <span className="text-sm">
            {isUploading ? 'กำลังอัพโหลด...' : 'คลิกเพื่ออัพโหลดรูปภาพ'}
          </span>
          <span className="text-xs text-gray-400">
            รองรับไฟล์ JPG, PNG และ WebP ขนาดไม่เกิน 5MB
          </span>
        </button>
      )}
    </div>
  );
}