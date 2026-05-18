import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Trash2, Upload, Box, Image as ImageIcon, Search, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../../services/storage';
import { resizeImage } from '../../lib/image';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { cn } from '../../lib/utils';

type ImageSource = 'upload' | 'camera' | 'google' | 'search' | 'url';

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
  const [source, setSource] = useState<ImageSource>('upload');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googlePhotos, setGooglePhotos] = useState<any[]>([]);
  const [googleAlbums, setGoogleAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'picker' | 'library'>(googleConnected ? 'library' : 'picker');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [currentObjectURL, setCurrentObjectURL] = useState<string | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);

  React.useEffect(() => {
    checkGoogleStatus();
  }, []);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview
      const isAllowedOrigin = event.origin.endsWith('.run.app') || 
                             event.origin.includes('localhost') || 
                             event.origin === window.location.origin;
      
      if (!isAllowedOrigin) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        console.log('Received OAUTH_AUTH_SUCCESS from origin:', event.origin);
        setGoogleConnected(true);
        setSource('google');
        checkGoogleStatus();
      }

      if (event.data?.type === 'PICKER_SUCCESS' && event.data?.sessionId) {
        if (activeSessionIdRef.current === event.data.sessionId) {
          console.log('Google Picker success for this instance. Session:', event.data.sessionId);
          activeSessionIdRef.current = null;
          fetchPickerResults(event.data.sessionId, true);
        }
      }

      if (event.data?.type === 'PICKER_ERROR') {
        setError(event.data.error || 'The picker encountered an error.');
        activeSessionIdRef.current = null;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  React.useEffect(() => {
    if (googleConnected && source === 'google' && googlePhotos.length === 0 && !googleLoading) {
       if (viewMode === 'library') fetchGooglePhotos();
    }
  }, [googleConnected, source, viewMode]);

  const checkGoogleStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status', { credentials: 'include' });
      const data = await res.json();
      setGoogleConnected(data.connected);
      if (data.connected && viewMode === 'library') {
        fetchGooglePhotos();
      }
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  const fetchGooglePhotos = async (albumId?: string) => {
    setGoogleLoading(true);
    setError(null);
    const effectiveAlbumId = albumId || selectedAlbumId;
    try {
      const url = effectiveAlbumId ? `/api/photos?albumId=${effectiveAlbumId}` : '/api/photos';
      const res = await fetch(url, { credentials: 'include' });
      
      if (res.status === 401) {
        setGoogleConnected(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Please sign in again and check the "See your Google Photos library" permission box.');
        }
        throw new Error(data.error || 'Failed to fetch photos');
      }

      const itemsData = data.mediaItems || data.media_items || [];
      const items = itemsData.filter((item: any) => item && (item.id || item.baseUrl || item.base_url));
      setGooglePhotos(items);

      // If library is empty, try fetching albums to give the user another way
      if (!effectiveAlbumId && items.length === 0) {
        fetchGoogleAlbums();
      }
    } catch (err: any) {
      console.error('Fetch photos failed:', err);
      setError(err.message || 'Could not load your Google photos.');
      
      // If we get a 403, it means the user denied the broad library scope.
      // Automatically switch to the "Picker" tab where they don't need that scope.
      if (err.message.includes('permission box')) {
        setViewMode('picker');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const fetchGoogleAlbums = async () => {
    try {
      const res = await fetch('/api/albums', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const albums = (data.albums || []).filter((a: any) => a && a.id);
        setGoogleAlbums(albums);
      }
    } catch (err) {
      console.error('Fetch albums failed:', err);
    }
  };

  const handleOpenPicker = async () => {
    setError(null);
    setGoogleLoading(true);
    
    // If we think we aren't connected, do the auth flow first
    if (!googleConnected) {
      handleConnectGoogle();
      setGoogleLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/photos/picker/session', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setGoogleConnected(false);
          handleConnectGoogle();
          return;
        }
        throw new Error(data.error || 'Failed to create picker session');
      }

      const pickerUri = data.pickerUri || data.picker_uri;
      const sessionId = data.id || data.sessionId;
      if (!pickerUri) throw new Error('No picker URI returned from Google');

      activeSessionIdRef.current = sessionId;
      const pickerWindow = window.open(pickerUri, 'google_photos_picker', 'width=600,height=700');
      
      if (!pickerWindow) {
        setError('Popup was blocked. Please allow popups for this site.');
      } else {
        // Polling as a fallback to postMessage
        let pollCount = 0;
        const maxPolls = 5;
        const pollTimer = setInterval(() => {
          if (pickerWindow.closed) {
            clearInterval(pollTimer);
            // If the ref is still set, it means postMessage wasn't received or didn't trigger yet
            if (activeSessionIdRef.current === sessionId) {
              console.log('Picker window closed, starting poll for results...');
              
              const pollForResults = async () => {
                if (activeSessionIdRef.current !== sessionId && pollCount > 0) return;
                
                pollCount++;
                console.log(`Polling attempt ${pollCount}/${maxPolls} for session ${sessionId}`);
                
                const foundItems = await fetchPickerResults(sessionId, false);
                
                if (!foundItems && pollCount < maxPolls && activeSessionIdRef.current === sessionId) {
                  console.log('No items found yet, retrying in 2 seconds...');
                  setTimeout(pollForResults, 2000);
                } else if (!foundItems && pollCount >= maxPolls) {
                  activeSessionIdRef.current = null;
                  setError('No photos were returned from your selection. Please try again.');
                } else {
                   activeSessionIdRef.current = null;
                }
              };

              // First poll after a short delay
              setTimeout(pollForResults, 1000);
            }
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to start picker session:', err);
      setError(err.message || 'Failed to start Google Photos Picker.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const fetchPickerResults = async (sessionId: string, wasExplicitSuccess: boolean) => {
    console.log(`[Picker] fetchPickerResults called for ${sessionId}. Explicit success: ${wasExplicitSuccess}`);
    setGoogleLoading(true);
    setUploading(true);
    try {
      const res = await fetch(`/api/photos/picker/items?sessionId=${sessionId}`, { credentials: 'include' });
      const data = await res.json();
      
      console.log(`[Picker] Backend returned status ${res.status}. Data keys:`, Object.keys(data));
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch chosen photos');
      
      const items = data.mediaItems || data.media_items || data.pickedMediaItems || data.picked_media_items;
      if (items && items.length > 0) {
        console.log(`[Picker] Found ${items.length} items in picker session`);
        
        for (const nestedItem of items) {
          const mediaItem = nestedItem.mediaItem || nestedItem.media_item || {};
          const item = {
            ...mediaItem,
            mediaFileUri: nestedItem.mediaFileUri || nestedItem.media_file_uri
          };
          await handleSelectGooglePhoto(item);
        }
        return true;
      } else if (wasExplicitSuccess) {
        console.warn('[Picker] No items found in picker session data after explicit success:', data);
        setError('No photos were returned. Did you forget to click "Done"?');
        return false;
      }
      return false;
    } catch (err: any) {
      console.error('[Picker] Fetch picked items failed:', err);
      setError(err.message || 'Failed to retrieve selected photos.');
      return false;
    } finally {
      setGoogleLoading(false);
      setUploading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setError(null);
    const authWindow = window.open('/api/auth/google/login', 'google_photos_auth', 'width=600,height=700');
    if (!authWindow) {
      setError('Popup was blocked. Please allow popups for this site.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search/images?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(imageUrl)}`;
      const res = await fetch(proxyUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not fetch image from URL');
      
      const blob = await res.blob();
      const file = new File([blob], 'url-image.jpg', { type: 'image/jpeg' });
      await performUpload(file);
      setImageUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to load image from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectSearchPhoto = async (photo: any) => {
    setUploading(true);
    setError(null);
    try {
      const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(photo.urls.regular)}`;
      const res = await fetch(proxyUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to download search result');
      
      const blob = await res.blob();
      const file = new File([blob], `unsplash-${photo.id}.jpg`, { type: 'image/jpeg' });
      await performUpload(file);
    } catch (err: any) {
      setError('Failed to process search result');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectGooglePhoto = async (photo: any) => {
    console.log('[Picker] Selecting photo:', photo.id || photo.filename || 'unknown');
    setUploading(true);
    setError(null);
    try {
      // Picker API provides mediaFileUri for downloading
      const downloadUrl = photo.mediaFileUri || photo.media_file_uri || `${photo.baseUrl || photo.base_url}=d`;
      console.log('[Picker] Proxying from URL:', downloadUrl.substring(0, 50) + '...');
      const proxyUrl = `/api/photos/proxy?url=${encodeURIComponent(downloadUrl)}`;
      const res = await fetch(proxyUrl, { credentials: 'include' });
      
      if (!res.ok) throw new Error(`Proxy failed with status ${res.status}`);
      
      const blob = await res.blob();
      console.log(`[Picker] Downloaded blob: ${blob.size} bytes. Type: ${blob.type}`);
      const file = new File([blob], `${photo.id || 'google-photo'}.jpg`, { type: 'image/jpeg' });
      
      await performUpload(file);
    } catch (err: any) {
      console.error('[Picker] Google Photo selection failed:', err);
      setError(`Could not download photo: ${err.message}`);
      setUploading(false);
    }
  };

  const performUpload = async (file: File) => {
    try {
      const resizedBlob = await resizeImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      const finalFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      const downloadURL = await uploadFile(finalFile, path || 'uploads', (p) => {
        setProgress(p);
      });

      setPreview(downloadURL);
      onUploadComplete(downloadURL);
      
      if (resetAfterUpload) {
        setTimeout(() => {
          setPreview(null);
          setProgress(0);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

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

    // Safety check for obvious oversized files
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

    await performUpload(file);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const Sources = () => (
    <div className="flex gap-1 p-1 bg-prism-50 rounded-xl mb-3 overflow-x-auto no-scrollbar">
      <button 
        onClick={() => setSource('upload')}
        className={cn(
          "flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
          source === 'upload' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
        )}
      >
        <Upload size={14} />
        File
      </button>
      <button 
        onClick={() => setSource('camera')}
        className={cn(
          "flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
          source === 'camera' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
        )}
      >
        <Camera size={14} />
        Camera
      </button>
      <button 
        onClick={() => setSource('google')}
        className={cn(
          "flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all relative",
          source === 'google' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
        )}
      >
        <ImageIcon size={14} />
        Photos
        {googleConnected && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm" />
        )}
      </button>
      <button 
        onClick={() => setSource('search')}
        className={cn(
          "flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
          source === 'search' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
        )}
      >
        <Search size={14} />
        Search
      </button>
      <button 
        onClick={() => setSource('url')}
        className={cn(
          "flex-none flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
          source === 'url' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
        )}
      >
        <Link size={14} />
        URL
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="relative group aspect-square">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        
        <button
          onClick={() => {
            if (source === 'camera') cameraInputRef.current?.click();
            else if (source === 'upload') fileInputRef.current?.click();
            else if (source === 'google') {
              if (googleConnected) {
                // In compact mode, we might want to show a small selection dialog 
                // but for now, we'll try the safe picker first
                handleOpenPicker();
              } else {
                handleOpenPicker(); // This will trigger handleConnectGoogle
              }
            }
          }}
          disabled={uploading || googleLoading}
          className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-prism-100 rounded-xl hover:border-accent-blue hover:bg-accent-blue/5 transition-all group overflow-hidden relative"
        >
          {preview ? (
            <img src={preview || undefined} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              {source === 'upload' && <Upload size={20} className="text-prism-300" />}
              {source === 'camera' && <Camera size={20} className="text-prism-300" />}
              {source === 'google' && <ImageIcon size={20} className="text-prism-300" />}
              <span className="text-[10px] font-bold text-prism-400 uppercase">{source}</span>
            </>
          )}

          {(uploading || googleLoading) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="animate-spin text-accent-blue" size={20} />
            </div>
          )}
        </button>

        {/* Source Toggle Overlays in compact mode */}
        {!preview && !uploading && (
          <div className="absolute -bottom-1 -right-1 flex gap-1 transform translate-y-full pt-2">
            {['upload', 'camera', 'google'].map((s) => (
              <button 
                key={s}
                onClick={() => setSource(s as ImageSource)}
                className={cn(
                  "p-1.5 rounded-full transition-all border",
                  source === s ? "bg-accent-blue text-white border-transparent" : "bg-white text-prism-400 border-prism-100"
                )}
              >
                {s === 'upload' && <Upload size={10} />}
                {s === 'camera' && <Camera size={10} />}
                {s === 'google' && <ImageIcon size={10} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-bold text-prism-700 block">{label}</label>}
      
      <Sources />

      <div 
        className={cn(
          "relative min-h-[160px] border-2 border-dashed rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center p-6 bg-white",
          preview ? "border-prism-200" : "border-prism-100 hover:border-accent-blue hover:bg-accent-blue/5",
          error ? "border-red-200 bg-red-50" : ""
        )}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

        {preview && !uploading ? (
          <div className="absolute inset-0 group">
            <img src={preview || undefined} alt="Upload preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  if (source === 'camera') cameraInputRef.current?.click();
                  else fileInputRef.current?.click();
                }}
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
        ) : !uploading && source !== 'google' ? (
          <button
            onClick={() => {
              if (source === 'camera') cameraInputRef.current?.click();
              else fileInputRef.current?.click();
            }}
            className="flex flex-col items-center gap-3 text-prism-400 group-hover:text-accent-blue transition-colors"
          >
            <div className="p-3 bg-prism-50 rounded-full group-hover:bg-accent-blue/10 transition-colors">
              {source === 'camera' ? <Camera size={24} /> : <Upload size={24} />}
            </div>
            <div className="text-center">
              <span className="text-sm font-bold block mb-1">
                {source === 'camera' ? 'Open Camera' : 'Click to upload photo'}
              </span>
              <span className="text-xs">Supports JPG, PNG (Max 15MB)</span>
            </div>
          </button>
        ) : !uploading && source === 'google' ? (
          <div className="w-full h-full flex flex-col p-4 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 p-1 bg-prism-50 rounded-lg w-fit">
                <button 
                  onClick={() => setViewMode('library')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                    viewMode === 'library' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
                  )}
                >
                  Gallery
                </button>
                <button 
                  onClick={() => setViewMode('picker')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                    viewMode === 'picker' ? "bg-white text-prism-900 shadow-sm" : "text-prism-400 hover:text-prism-600"
                  )}
                >
                  Picker
                </button>
              </div>

              {googleConnected && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg text-prism-400"
                    onClick={() => viewMode === 'library' ? fetchGooglePhotos() : handleOpenPicker()}
                    disabled={googleLoading}
                  >
                    <Loader2 size={14} className={cn(googleLoading && "animate-spin")} />
                  </Button>
                </div>
              )}
            </div>

            {viewMode === 'picker' ? (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-accent-blue/5 rounded-full text-accent-blue">
                    <ImageIcon size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-prism-900">Google Photos Picker</p>
                    <p className="text-xs text-prism-400 max-w-[240px]">
                      The secure, Google-hosted way to pick specific photos.
                    </p>
                  </div>
                  <Button 
                    variant="prism" 
                    size="sm" 
                    onClick={handleOpenPicker} 
                    disabled={googleLoading}
                    className="rounded-full shadow-lg shadow-accent-blue/20"
                  >
                    {googleLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {googleConnected ? 'Open Picker' : 'Connect & Select'}
                  </Button>
                  
                  {googleConnected && (
                    <p className="text-[10px] text-prism-400 max-w-[200px]">
                      No photos appearing? Try the "Browse Library" tab instead.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {!googleConnected ? (
                   <div className="flex flex-col items-center justify-center flex-1 py-8 text-center gap-4">
                     <AlertCircle size={32} className="text-prism-300" />
                     <div className="space-y-1">
                       <p className="text-sm font-bold text-prism-900">Connection Required</p>
                       <p className="text-xs text-prism-500">Sign in to browse your full library here.</p>
                     </div>
                     <Button size="sm" onClick={handleConnectGoogle}>Sign In</Button>
                   </div>
                ) : googleLoading ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12">
                    <Loader2 size={32} className="animate-spin text-accent-blue mb-4" />
                    <p className="text-xs text-prism-500">Syncing with library...</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto no-scrollbar min-h-[200px]">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAlbumId && (
                        <button
                          onClick={() => {
                            setSelectedAlbumId(null);
                            setGooglePhotos([]);
                            fetchGoogleAlbums();
                          }}
                          className="aspect-square flex flex-col items-center justify-center bg-prism-50 border border-dashed border-prism-200 rounded-lg hover:bg-prism-100 transition-all text-accent-blue"
                        >
                          <Box size={24} />
                          <span className="text-[10px] font-bold mt-1">Back</span>
                        </button>
                      )}

                      {googlePhotos.filter(p => p && p.id).map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => handleSelectGooglePhoto(photo)}
                          className="aspect-square relative group rounded-lg overflow-hidden border border-prism-100 hover:border-accent-blue transition-all"
                        >
                          <img 
                            src={`${photo.baseUrl || photo.base_url}=w200-h200-c`} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Upload size={20} className="text-white" />
                          </div>
                        </button>
                      ))}

                      {!selectedAlbumId && googleAlbums.filter(a => a && a.id).map((album) => {
                        const coverUrl = album.coverPhotoBaseUrl || album.cover_photo_base_url;
                        return (
                          <button
                            key={album.id}
                            onClick={() => {
                              setSelectedAlbumId(album.id);
                              fetchGooglePhotos(album.id);
                            }}
                            className="aspect-square relative group rounded-lg overflow-hidden border border-prism-100 hover:border-accent-blue transition-all bg-prism-50 flex flex-col"
                          >
                            {coverUrl ? (
                               <img 
                                 src={`${coverUrl}=w200-h200-c`} 
                                 alt="" 
                                 className="w-full h-2/3 object-cover group-hover:scale-110 transition-transform" 
                               />
                            ) : (
                            <div className="w-full h-2/3 bg-prism-100 flex items-center justify-center">
                              <Box size={24} className="text-prism-300" />
                            </div>
                          )}
                          <div className="p-1 px-2 h-1/3 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-prism-700 truncate line-clamp-2 leading-tight">{album.title}</span>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                    
                    {googlePhotos.length === 0 && googleAlbums.length === 0 && (
                      <div className="text-center py-6 px-4 bg-prism-50/50 rounded-2xl border border-prism-100 mt-4">
                        <p className="text-sm font-bold text-prism-900 mb-2">Library Empty or Hidden</p>
                        <p className="text-[10px] text-prism-500 mb-4 leading-relaxed bg-white p-3 rounded-xl border border-prism-50">
                          During login, you <span className="font-bold underline">MUST</span> check:<br/>
                          <span className="italic">"See your Google Photos library"</span>
                        </p>
                        <Button variant="ghost" size="xs" onClick={() => {
                          setGoogleConnected(false);
                          handleConnectGoogle();
                        }} className="text-accent-blue font-bold">
                          Retry with Permission
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {googleConnected && (
              <div className="pt-2 mt-auto border-t border-prism-50 flex justify-between items-center">
                <p className="text-[9px] text-prism-300 italic">Connected to Google</p>
                <button 
                  onClick={() => setGoogleConnected(false)}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : !uploading && source === 'search' ? (
          <div className="w-full h-full flex flex-col p-4 space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search Unsplash visuals..."
                className="flex-1 bg-prism-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-accent-blue outline-none"
              />
              <Button size="sm" onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[150px] no-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectSearchPhoto(photo)}
                    className="aspect-square relative group rounded-xl overflow-hidden border border-prism-100 hover:border-accent-blue transition-all"
                  >
                    <img 
                      src={photo.urls?.thumb || undefined} 
                      alt={photo.alt_description} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-sm">
                      <p className="text-[8px] text-white truncate">by {photo.user.name}</p>
                    </div>
                  </button>
                ))}
                {!searchLoading && searchResults.length === 0 && searchQuery && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-xs text-prism-400">No visuals found for "{searchQuery}"</p>
                  </div>
                )}
                {!searchLoading && searchResults.length === 0 && !searchQuery && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-xs text-prism-400 italic">Try "abstract architecture" or "mountain peaks"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !uploading && source === 'url' ? (
          <div className="w-full flex flex-col items-center justify-center p-8 gap-4">
            <div className="p-4 bg-accent-blue/5 rounded-full text-accent-blue">
               <Link size={32} />
            </div>
            <div className="w-full space-y-3">
              <p className="text-sm font-bold text-center text-prism-900">Import from URL</p>
              <input 
                type="url" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-prism-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none"
              />
              <Button 
                variant="prism" 
                className="w-full rounded-xl" 
                onClick={handleUrlSubmit}
                disabled={!imageUrl}
              >
                Capture from URL
              </Button>
            </div>
          </div>
        ) : null}

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
