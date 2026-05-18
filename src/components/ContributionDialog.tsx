import React, { useState } from 'react';
import { Send, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { FilePicker } from './ui/FilePicker';

export function ContributionDialog({ eventId, onClose, onSuccess }: { eventId: string, onClose: () => void, onSuccess: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user || (!text.trim() && photos.length === 0)) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'events', eventId, 'contributions'), {
        eventId, 
        authorId: user.uid, 
        authorName: profile?.displayName || user.displayName || 'Guest', 
        text, 
        photos,
        status: 'published', // Contributions are auto-published by collaborators for this UX
        createdAt: serverTimestamp()
      });
      onSuccess(); 
      onClose();
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, `events/${eventId}/contributions`); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title="Contribute a Memory">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-prism-400 uppercase tracking-widest">Your Perspective</label>
          <textarea 
            required 
            value={text} 
            onChange={e => setText(e.target.value)} 
            className="w-full p-4 bg-prism-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent-purple transition-all min-h-[120px]" 
            placeholder="Share your story of this moment..." 
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-prism-400 uppercase tracking-widest">Photo Evidence</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-prism-100">
                <img src={photo || undefined} alt="" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setPhotos(p => p.filter((_, i) => i !== idx))}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <FilePicker 
                compact 
                resetAfterUpload 
                path={`events/${eventId}/contributions`} 
                onUploadComplete={url => setPhotos(p => [...p, url])} 
              />
            )}
          </div>
        </div>

        <Button className="w-full" disabled={loading} variant="prism">
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <div className="flex items-center gap-2">
              <span>Publish Memory</span>
              <Send size={16} />
            </div>
          )}
        </Button>
      </form>
    </Dialog>
  );
}
