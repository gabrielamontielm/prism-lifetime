/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LifeEvent, Contribution } from '../types';
import { X, Calendar, Tag as TagIcon, Users, Image as ImageIcon, MessageSquare, PlusCircle, Share2, Check, Edit2, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { ContributionDialog } from './ContributionDialog';
import { CreateEventDialog } from './CreateEventDialog';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface EventDetailProps {
  event: LifeEvent;
  onClose: () => void;
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  const { isEditor, user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = user?.uid === event.ownerId;
  const canEdit = isEditor || isOwner;

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('eventId', event.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action is irreversible.')) return;
    try {
      await deleteDoc(doc(db, 'events', event.id));
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${event.id}`);
    }
  };

  // SEO & Metadata
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${event.title} | Prism Lifetime`;
    
    // Set meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute('content', event.description.substring(0, 160));
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalDesc);
    };
  }, [event.title, event.description]);

  useEffect(() => {
    const contributionsRef = collection(db, 'events', event.id, 'contributions');
    
    // Non-editors can only see published contributions
    // Editors can see everything (we could add a separate view for them, but for now they see all)
    const q = isEditor 
      ? query(contributionsRef, orderBy('createdAt', 'desc'))
      : query(contributionsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Contribution[];
      setContributions(data);
    });

    return () => unsubscribe();
  }, [event.id]);

  const publishedContributions = contributions.filter(c => c.status === 'published');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-end bg-prism-900/40 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-full glass rounded-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Header */}
        <div className="relative h-64 sm:h-80 w-full shrink-0">
          <img 
            src={event.primaryPhoto || "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1200"} 
            alt={event.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            {canEdit && (
              <>
                <button 
                  onClick={() => setShowEditDialog(true)}
                  className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                  title="Edit Achievement"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-full transition-colors backdrop-blur-md"
                  title="Delete Achievement"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button 
              onClick={handleShare}
              className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
              title="Share Achievement"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl font-bold text-white mb-2 font-display">{event.title}</h2>
            <div className="flex flex-wrap gap-4 text-white/90 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {event.location.address.split(',')[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-prism-400 uppercase tracking-widest">The Story</h3>
              {canEdit && (
                <button 
                  onClick={() => setShowEditDialog(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"
                >
                  <Edit2 size={14} />
                  Edit Story
                </button>
              )}
            </div>
            <p className="text-prism-700 leading-relaxed text-lg">
              {event.description}
            </p>
          </section>

          {event.location && (
            <section>
              <h3 className="text-sm font-bold text-prism-400 uppercase tracking-widest mb-4">Location</h3>
              {(() => {
                const hasValidMapsKey = Boolean(process.env.GOOGLE_MAPS_PLATFORM_KEY);
                if (!hasValidMapsKey) {
                  return (
                    <div className="h-48 w-full rounded-2xl bg-prism-50 border border-prism-100 flex flex-col items-center justify-center p-6 text-center">
                      <MapPin size={24} className="text-prism-200 mb-2" />
                      <p className="text-xs text-prism-400">Map unavailable (API Key not configured)</p>
                    </div>
                  );
                }
                return (
                  <div className="h-48 w-full rounded-2xl overflow-hidden border border-prism-100 shadow-sm relative z-0">
                    <Map
                      defaultCenter={{ lat: event.location.lat, lng: event.location.lng }}
                      defaultZoom={15}
                      mapId="MAIN_MAP"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      gestureHandling="cooperative"
                      disableDefaultUI
                    >
                      <AdvancedMarker position={{ lat: event.location.lat, lng: event.location.lng }}>
                        <Pin background="#4285F4" glyphColor="#fff" />
                      </AdvancedMarker>
                    </Map>
                  </div>
                );
              })()}
              <p className="mt-3 text-xs text-prism-500 font-medium flex items-center gap-2">
                <MapPin size={12} className="text-accent-blue" />
                {event.location.address}
              </p>
            </section>
          )}

          {event.additionalPhotos && event.additionalPhotos.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-prism-400 uppercase tracking-widest mb-4">Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.additionalPhotos.map((photo, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square rounded-2xl overflow-hidden border border-prism-100 shadow-sm"
                  >
                    <img 
                      src={photo} 
                      alt={`Gallery item ${i + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-prism-400 uppercase tracking-widest mb-4">Tags & Categories</h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-bold border border-accent-blue/20">
                  <TagIcon size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-prism-400 uppercase tracking-widest">Shared Memories</h3>
              <button 
                onClick={() => setShowAddContribution(true)}
                className="text-xs font-bold text-accent-purple hover:underline flex items-center gap-1"
              >
                <PlusCircle size={14} /> Add Yours
              </button>
            </div>
            
            {publishedContributions.length > 0 ? (
              <div className="space-y-6">
                {publishedContributions.map(contribution => (
                  <div key={contribution.id} className="bg-prism-100/50 rounded-2xl p-5 border border-prism-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple font-bold text-xs">
                        {contribution.authorName?.[0]}
                      </div>
                      <span className="font-bold text-sm text-prism-900">{contribution.authorName}</span>
                    </div>
                    <p className="text-prism-600 text-sm leading-relaxed italic mb-4">"{contribution.text}"</p>
                    {contribution.photos && contribution.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {contribution.photos.map((p, i) => (
                          <img 
                            key={i} 
                            src={p} 
                            alt="" 
                            className="w-20 h-20 rounded-xl object-cover border border-prism-100 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-2xl border-2 border-dashed border-prism-100">
                <MessageSquare size={24} className="mx-auto text-prism-200 mb-2" />
                <p className="text-prism-400 text-sm">No shared memories yet. Invite participants to contribute!</p>
              </div>
            )}
          </section>
        </div>

        <AnimatePresence>
          {showAddContribution && (
            <ContributionDialog 
              eventId={event.id}
              onClose={() => setShowAddContribution(false)}
              onSuccess={() => {}}
            />
          )}
          {showEditDialog && (
            <CreateEventDialog 
              editEvent={event}
              onClose={() => setShowEditDialog(false)}
              onSuccess={() => {}}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

