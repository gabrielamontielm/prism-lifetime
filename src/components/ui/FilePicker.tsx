import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../../services/storage';
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
  const [synchronized, setSynchronized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'optimizing' | 'sending' | 'finishing'>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(initialPreview || null);
  }, [initialPreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    // Immediate local preview for better UX
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploading(true);
    setSyncStatus('optimizing');
    setError(null);
    setProgress(0);

    try {
      const resizeImage = (source: HTMLImageElement): Promise<Blob | null> => {
        return new Promise((resolve) => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1200;
            let width = source.width;
            let height = source.height;

            if (width > height) {
              if (width > MAX_DIM) {
                height *= MAX_DIM / width;
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width *= MAX_DIM / height;
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(source, 0, 0, width, height);

            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
          } catch (e) {
            console.error('[FilePicker] Canvas processing failed:', e);
            resolve(null);
          }
        });
      };

      // Load image reliably
      const img = new Image();
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image for processing'));
        img.src = localPreviewUrl;
      });

      const loadedImg = await imageLoadPromise;
      const resizedBlob = await resizeImage(loadedImg);

      if (!resizedBlob) {
        throw new Error('Image processing failed');
      }

      setSyncStatus('sending');
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const resizedFile = new File([resizedBlob], filename, { type: 'image/jpeg' });
      
      const url = await uploadFile(resizedFile, path, (p) => setProgress(p));
      
      setSyncStatus('finishing');
      onUploadComplete(url);
      setSynchronized(true);
      setTimeout(() => setSynchronized(false), 3000);
      
      if (resetAfterUpload) {
        setPreview(null);
      }
    } catch (err: any) {
      setError(err.message || 'Transmission failed. Please try again.');
      console.error('[FilePicker] Error:', err);
      setPreview(initialPreview || null); // Revert to original preview on error
    } finally {
      setUploading(false);
      setSyncStatus('idle');
      URL.revokeObjectURL(localPreviewUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input to allow re-selecting same file
      }
    }
  };

  return (
    <div className="space-y-4">
      {label && <label className="text-sm font-bold text-prism-700 block">{label}</label>}
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'relative group w-full rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer',
          compact ? 'h-32' : 'h-64',
          uploading ? 'border-accent-blue/50 bg-accent-blue/5' : 'border-prism-200 hover:border-accent-blue/50 hover:bg-prism-50',
          preview ? 'border-solid' : 'py-4'
        )}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                title="Change Photo"
              >
                <Camera size={24} />
              </button>
              {onClear && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    onClear();
                  }}
                  className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors text-white"
                  title="Remove Photo"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center px-4">
            <div className={cn('bg-prism-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-accent-blue/10 transition-colors', compact ? 'w-10 h-10' : 'w-16 h-16')}>
              <Camera className="text-prism-400 group-hover:text-accent-blue transition-colors" size={compact ? 20 : 28} />
            </div>
            {!compact ? (
              <>
                <p className="text-sm font-medium text-prism-500">Click to upload milestone photo</p>
                <p className="text-xs text-prism-400 mt-1">PNG, JPG up to 10MB</p>
              </>
            ) : (
              <p className="text-[10px] font-bold text-prism-400 uppercase tracking-tight">{label || 'Upload'}</p>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <Loader2 className="animate-spin text-accent-blue" size={32} />
              {syncStatus === 'sending' && (
                <span className="absolute text-[10px] font-bold text-accent-blue">{Math.round(progress)}%</span>
              )}
            </div>
            <p className="text-sm font-bold text-prism-900">
              {syncStatus === 'optimizing' && 'Optimizing Prism...'}
              {syncStatus === 'sending' && 'Sending to Prism...'}
              {syncStatus === 'finishing' && 'Aligning Prism...'}
            </p>
            <div className="w-full max-w-[120px] bg-prism-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-accent-blue transition-all duration-300" 
                style={{ width: syncStatus === 'optimizing' ? '30%' : syncStatus === 'sending' ? `${30 + progress * 0.6}%` : '100%' }} 
              />
            </div>
          </div>
        )}
        {synchronized && !uploading && (
          <div className="absolute inset-0 bg-accent-blue/10 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <CheckCircle2 className="text-accent-blue mb-2" size={32} />
            <p className="text-sm font-bold text-accent-blue">Synchronized</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100"><AlertCircle size={14} />{error}</div>}
      </AnimatePresence>
    </div>
  );
}
