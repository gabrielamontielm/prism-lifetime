import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, LogIn, ChevronLeft, Album, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

export function GooglePhotosBrowser({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google/status').then(r => r.json()).then(d => {
      setAuthenticated(d.authenticated);
      if (d.authenticated) fetch('/api/photos/albums').then(r => r.json()).then(d => setAlbums(d.albums || []));
    });
  }, []);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold">Google Photos</h3>
        <button onClick={onClose}><ChevronLeft /></button>
      </div>
      {!authenticated ? <Button onClick={() => fetch('/api/auth/google/url').then(r => r.json()).then(d => window.open(d.url))}>Connect</Button> : (
        <div className="grid grid-cols-2 gap-4">
          {albums.map(a => <div key={a.id} onClick={() => onSelect(a.coverPhotoBaseUrl)} className="cursor-pointer">{a.title}</div>)}
        </div>
      )}
    </div>
  );
}
