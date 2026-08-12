import React, { useRef, useState } from 'react';
import { compressImageBase64 } from '../utils/imageCompressor';

interface DocumentUploadInputProps {
  label: string;
  photoUrl: string;
  onPhotoChange: (newUrl: string) => void;
  isAmharic: boolean;
  id?: string;
}

export const DocumentUploadInput: React.FC<DocumentUploadInputProps> = ({
  label,
  photoUrl,
  onPhotoChange,
  isAmharic,
  id = Math.random().toString(36).substr(2, 9),
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          const rawBase64 = reader.result.toString();
          try {
            const compressedBase64 = await compressImageBase64(rawBase64);
            onPhotoChange(compressedBase64);
          } catch (err) {
            console.error('Failed to compress image, using original:', err);
            onPhotoChange(rawBase64);
          }
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasPhoto = Boolean(photoUrl && photoUrl.trim() !== '');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-on-surface">
          {label}
        </label>
        {hasPhoto && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            <span>{isAmharic ? 'ተጭኗል' : 'Uploaded'}</span>
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`doc-upload-${id}`}
      />

      {!hasPhoto ? (
        <div
          onClick={triggerSelect}
          className="relative border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container/30 hover:bg-sky-50/30 rounded-xl p-3 text-center transition-all cursor-pointer min-h-[110px] flex flex-col items-center justify-center space-y-1 group"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-1 py-2">
              <span className="material-symbols-outlined animate-spin text-primary text-[24px]">progress_activity</span>
              <span className="text-[11px] font-bold text-sky-800">
                {isAmharic ? 'ምስሉ እየተጫነ ነው...' : 'Uploading image...'}
              </span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              </div>
              <p className="text-xs font-bold text-primary group-hover:text-sky-700">
                {isAmharic ? 'ፎቶ/ምስል ይጫኑ' : 'Upload Photo'}
              </p>
              <p className="text-[10px] text-secondary">
                {isAmharic ? 'ለማያያዝ እዚህ ይጫኑ' : 'Click to select picture'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="relative border border-outline-variant rounded-xl overflow-hidden bg-surface group">
          {/* Image Preview */}
          <div className="h-28 w-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
            <img
              src={photoUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
              referrerPolicy="no-referrer"
            />
            {/* Quick Actions Hover Overlay */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={triggerSelect}
                className="bg-white/90 hover:bg-white text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>{isAmharic ? 'ቀይር' : 'Change'}</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                <span>{isAmharic ? 'ሰርዝ' : 'Remove'}</span>
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-2.5 py-1.5 bg-surface-container/60 border-t border-outline-variant flex items-center justify-between text-[10px]">
            <span className="text-secondary truncate max-w-[120px]">{label}</span>
            <button
              type="button"
              onClick={triggerSelect}
              className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[12px]">photo_camera</span>
              <span>{isAmharic ? 'ቀይር' : 'Change'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
