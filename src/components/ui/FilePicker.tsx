import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../../services/storage';
import { resizeImage } from '../../lib/image';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface FilePickerProps {
  onUploadComplete: (url: string) => void;
  onClear?: () => void;
  path: string;
  label?: string;
  previewUrl?: string | null;
  compact?: boolean;
  resetAfterUpload?: boolean;
}

export function FilePicker({ onUploadComplete, onClear, path, label, previewUrl: initialPreview, compact, resetAfterUpload }: FilePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentObjectURL, setCurrentObjectURL] = useState<string | null>(null);

  React.useEffect(() => {
    setPreview(initialPreview || null);
  }, [initialPreview]);

  // Cleanup object URLs to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
      }
    };
  }, [currentObjectURL]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety check for obvious oversized files (allow reasonable overhead)
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large (>20MB). Please select a smaller image.');
      return;
    }

    // Immediate local preview
    const localUrl = URL.createObjectURL(file);
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    setCurrentObjectURL(localUrl);
    setPreview(localUrl);
    
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Optimize
      const optimizedBlob = await resizeImage(file, {
        maxWidth: 1200,
        quality: 0.7,
        format: 'image/jpeg'
      });

      // 2. Transmit
      const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const finalFile = new File([optimizedBlob], safeFilename, { type: 'image/jpeg' });
      
      const downloadUrl = await uploadFile(finalFile, path, (p) => setProgress(p));
      
      // 3. Finalize
      onUploadComplete(downloadUrl);
      
      if (resetAfterUpload) {
        setPreview(null);
        if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
        setCurrentObjectURL(null);
      }
    } catch (err: any) {
      console.error('[FilePicker] Upload failed:', err);
      const message = err.message || 'Transmission failed';
      setError(`${message}. Please try again.`);
      
      // Revert to original if not a fresh selection
      if (!initialPreview) {
        setPreview(null);
      } else {
        setPreview(initialPreview);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (compact) {
    return (
      <div className="relative group aspect-square">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-prism-100 rounded-xl hover:border-accent-blue hover:bg-accent-blue/5 transition-all group overflow-hidden relative"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera size={20} className="text-prism-300 group-hover:text-accent-blue transition-colors" />
              <span className="text-[10px] font-bold text-prism-400 group-hover:text-accent-blue">ADD</span>
            </>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="animate-spin text-accent-blue" size={20} />
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-bold text-prism-700 block">{label}</label>}
      
      <div 
        className={cn(
          "relative min-h-[160px] border-2 border-dashed rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center p-6 bg-white",
          preview ? "border-prism-200" : "border-prism-100 hover:border-accent-blue hover:bg-accent-blue/5",
          error ? "border-red-200 bg-red-50" : ""
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {preview && !uploading ? (
          <div className="absolute inset-0 group">
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white"
              >
                Change
              </Button>
              {onClear && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    onClear();
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border-none"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        ) : !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 text-prism-400 group-hover:text-accent-blue transition-colors"
          >
            <div className="p-3 bg-prism-50 rounded-full group-hover:bg-accent-blue/10 transition-colors">
              <Camera size={24} />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold block mb-1">Click to upload photo</span>
              <span className="text-xs">Supports JPG, PNG (Max 15MB)</span>
            </div>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-accent-blue mb-4" size={24} />
            <div className="w-full max-w-[100px] bg-prism-100 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-blue transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-prism-400 mt-3">Uploading...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded-lg">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
