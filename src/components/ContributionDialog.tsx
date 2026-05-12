import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

export function ContributionDialog({ eventId, onClose, onSuccess }: { eventId: string, onClose: () => void, onSuccess: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'events', eventId, 'contributions'), {
        eventId, authorId: user.uid, authorName: profile?.displayName || user.displayName || 'Guest', text, status: 'pending', createdAt: serverTimestamp()
      });
      onSuccess(); onClose();
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, `events/${eventId}/contributions`); }
    finally { setLoading(false); }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title="Add Memory">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea required value={text} onChange={e => setText(e.target.value)} className="w-full p-4 bg-prism-50 rounded-xl" placeholder="Story..." />
        <Button className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Submit"}</Button>
      </form>
    </Dialog>
  );
}
