import React, { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Contribution } from '../types';
import { Check, X, Clock, MessageSquare, Loader2, EyeOff, ArchiveRestore } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useTimeline } from '../hooks/useTimeline';

export function EditorDashboard() {
  const { isEditor, profile } = useAuth();
  const [pending, setPending] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { events } = useTimeline();

  useEffect(() => {
    if (!isEditor) return;
    const q = query(collectionGroup(db, 'contributions'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPending(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Contribution[]);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contributions (group)'));
    return () => unsubscribe();
  }, [isEditor]);

  const handleAction = async (contribution: Contribution, status: 'published' | 'declined') => {
    try {
      await updateDoc(doc(db, 'events', contribution.eventId, 'contributions', contribution.id), {
        status, approvedAt: status === 'published' ? serverTimestamp() : null, approvedBy: profile?.uid
      });
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `events/${contribution.eventId}/contributions/${contribution.id}`); }
  };

  if (!isEditor) return null;

  return (
    <div className="space-y-12 mt-12 pb-20">
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-display">Moderation Queue</h2>
        </div>
        {loading ? <Loader2 className="animate-spin" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {pending.map(item => (
                <Card key={item.id} className="p-6">
                  <span className="text-sm font-bold">{item.authorName}</span>
                  <p className="text-sm my-4 italic">"{item.text}"</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(item, 'published')}><Check size={14} /> Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAction(item, 'declined')}><X size={14} /> Decline</Button>
                  </div>
                </Card>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
