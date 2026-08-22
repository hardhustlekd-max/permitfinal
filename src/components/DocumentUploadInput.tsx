import React, { useRef, useState } from 'react';
import { compressImageBase64 } from '../utils/imageCompressor';
import { SmartImage } from './SmartImage';
import { ZoomableDocumentContainer } from './ZoomableDocumentContainer';

interface DocumentUploadInputProps {
  label: string;
  photoUrl: string;
  onPhotoChange: (newUrl: string) => void;
  isAmharic: boolean;
  id?: string;
  hasError?: boolean;
}

export const DocumentUploadInput: React.FC<DocumentUploadInputProps> = ({
  label,
  photoUrl,
  onPhotoChange,
  isAmharic,
  id = Math.random().toString(36).substr(2, 9),
  hasError = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

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
        <label className={`block text-[11px] font-bold ${hasError && !hasPhoto ? 'text-red-600 dark:text-red-400' : 'text-on-surface'}`}>
          {label}
        </label>
        {hasPhoto ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            <span>{isAmharic ? 'ተጭኗል' : 'Uploaded'}</span>
          </span>
        ) : hasError ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800 animate-pulse">
            <span className="material-symbols-outlined text-[13px]">error</span>
            <span>{isAmharic ? 'ያስፈልጋል' : 'Required'}</span>
          </span>
        ) : null}
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
          className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer min-h-[110px] flex flex-col items-center justify-center space-y-1 group ${
            hasError
              ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 ring-2 ring-red-500/30'
              : 'border-outline-variant hover:border-[#0B1E48] bg-surface-container/30 hover:bg-[#0B1E48]/5'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-1 py-2">
              <span className="material-symbols-outlined animate-spin text-[#0B1E48] text-[24px]">progress_activity</span>
              <span className="text-[11px] font-bold text-[#0B1E48]">
                {isAmharic ? 'ምስሉ እየተጫነ ነው...' : 'Uploading image...'}
              </span>
            </div>
          ) : (
            <>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                hasError
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-[#0B1E48]/10 text-[#0B1E48]'
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {hasError ? 'warning' : 'add_a_photo'}
                </span>
              </div>
              <p className={`text-xs font-bold ${hasError ? 'text-red-600 dark:text-red-400' : 'text-[#0B1E48]'}`}>
                {hasError
                  ? isAmharic ? 'እባክዎ ሰነዱን ይጫኑ' : 'Please upload document'
                  : isAmharic ? 'ፎቶ/ምስል ይጫኑ' : 'Upload Photo'}
              </p>
              <p className={`text-[10px] ${hasError ? 'text-red-500 font-semibold' : 'text-secondary'}`}>
                {isAmharic ? 'ለማያያዝ እዚህ ይጫኑ' : 'Click to select picture'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="relative border border-outline-variant rounded-xl overflow-hidden bg-surface group">
          {/* Image Preview */}
          <div className="h-28 w-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
            <SmartImage
              src={photoUrl}
              alt={label}
              fallbackIcon="add_a_photo"
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
            />
            {/* Quick Actions Hover Overlay */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowZoom(true);
                }}
                className="bg-primary hover:bg-primary-hover text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-105"
                title={isAmharic ? 'አጉላ' : 'Zoom Image'}
              >
                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                <span>{isAmharic ? 'አጉላ' : 'Zoom'}</span>
              </button>
              <button
                type="button"
                onClick={triggerSelect}
                className="bg-white/90 hover:bg-white text-slate-900 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>{isAmharic ? 'ቀይር' : 'Change'}</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                <span>{isAmharic ? 'ሰርዝ' : 'Remove'}</span>
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-2.5 py-1.5 bg-surface-container/60 border-t border-outline-variant flex items-center justify-between text-[10px]">
            <span className="text-secondary truncate max-w-[120px]">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowZoom(true)}
                className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">zoom_in</span>
                <span>{isAmharic ? 'አጉላ' : 'Zoom'}</span>
              </button>
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
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED UPLOADED DOCUMENT INSPECTION */}
      {showZoom && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setShowZoom(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
            <ZoomableDocumentContainer
              lang={isAmharic ? 'am' : 'en'}
              title={label}
              onClose={() => setShowZoom(false)}
              requireClerkRequest={false}
            >
              <img
                src={photoUrl}
                alt={label}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </ZoomableDocumentContainer>
          </div>
        </div>
      )}
    </div>
  );
};
