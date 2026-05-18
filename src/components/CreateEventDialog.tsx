import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Tag as TagIcon, Loader2, X, Users, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { FilePicker } from './ui/FilePicker';
import { UserSearch } from './ui/UserSearch';
import { UserProfile, LifeEvent, EventLocation } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { cn } from '../lib/utils';

interface CreateEventDialogProps {
  onClose: () => void;
  onSuccess: () => void;
  editEvent?: LifeEvent;
}

const CATEGORIES = ["Career", "Personal", "Travel", "Health", "Education", "Art", "Community"];

export function CreateEventDialog({ onClose, onSuccess, editEvent }: CreateEventDialogProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || '',
    date: editEvent?.date || '',
    primaryPhoto: editEvent?.primaryPhoto || '',
    additionalPhotos: editEvent?.additionalPhotos || [] as string[],
    tags: editEvent?.tags || [] as string[],
    location: editEvent?.location || null as EventLocation | null,
    participants: [] as UserProfile[]
  });

  useEffect(() => {
    if (editEvent?.participants && editEvent.participants.length > 0) {
      const fetchParticipants = async () => {
        const otherParticipantIds = editEvent.participants.filter(id => id !== user?.uid);
        if (otherParticipantIds.length === 0) return;
        try {
          const q = query(collection(db, 'users'), where('uid', 'in', otherParticipantIds));
          const snapshot = await getDocs(q);
          setFormData(prev => ({ ...prev, participants: snapshot.docs.map(d => d.data() as UserProfile) }));
        } catch (error) { console.error(error); }
      };
      fetchParticipants();
    }
  }, [editEvent, user]);

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(p => ({ ...p, tags: [...p.tags, currentTag.toLowerCase()] }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tagToRemove) }));
  };

  const removeParticipant = (uid: string) => {
    setFormData(p => ({ ...p, participants: p.participants.filter(part => part.uid !== uid) }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const eventData = { 
        title: formData.title, 
        description: formData.description, 
        date: formData.date, 
        primaryPhoto: formData.primaryPhoto,
        additionalPhotos: formData.additionalPhotos,
        tags: formData.tags, 
        location: formData.location,
        participants: [user.uid, ...formData.participants.map(p => p.uid)], 
        shareToken: profile?.shareToken || null,
        updatedAt: serverTimestamp() 
      };
      
      if (editEvent) {
        await updateDoc(doc(db, 'events', editEvent.id), eventData);
      } else {
        await addDoc(collection(db, 'events'), { 
          ...eventData, 
          ownerId: user.uid, 
          status: 'published', 
          createdAt: serverTimestamp() 
        });
      }
      onSuccess(); 
      onClose();
    } catch (error) { 
      handleFirestoreError(error, editEvent ? OperationType.UPDATE : OperationType.CREATE, 'events'); 
    } finally { 
      setLoading(false); 
    }
  };

  const totalSteps = 4;

  return (
    <Dialog 
      isOpen={true} 
      onClose={onClose} 
      title={editEvent ? "Refine Milestone" : "New Journey Entry"} 
      description={`Step ${step} of ${totalSteps}`} 
      className="max-w-xl"
    >
      <div className="min-h-[450px] flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-4">
                  <Input 
                    label="Milestone Title" 
                    placeholder="e.g., Summit of Kilimanjaro"
                    id="title" 
                    value={formData.title} 
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Event Date" 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} 
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-prism-700 block">Category</label>
                      <select 
                        className="w-full bg-prism-50 border-none rounded-xl outline-none py-3 px-4 transition-all focus:ring-2 focus:ring-accent-blue"
                        value={formData.tags.find(t => CATEGORIES.map(c => c.toLowerCase()).includes(t)) || ""}
                        onChange={(e) => {
                          const newCat = e.target.value.toLowerCase();
                          setFormData(prev => {
                            const otherTags = prev.tags.filter(t => !CATEGORIES.map(c => c.toLowerCase()).includes(t));
                            return { ...prev, tags: [newCat, ...otherTags] };
                          });
                        }}
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-prism-700 block">The Narrative</label>
                    <textarea 
                      rows={4} 
                      value={formData.description} 
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                      className="w-full px-4 py-3 rounded-xl bg-prism-50 border-none outline-none focus:ring-2 focus:ring-accent-blue transition-all" 
                      placeholder="Tell the story of this achievement..." 
                    />
                  </div>

                  <PlaceAutocomplete 
                    onPlaceSelect={loc => setFormData(p => ({ ...p, location: loc }))} 
                    defaultValue={formData.location?.address}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-6">
                  <div className="p-4 bg-prism-50 rounded-2xl border border-prism-100">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-blue mb-4 block">Primary Cover</label>
                    <FilePicker 
                      path="events" 
                      previewUrl={formData.primaryPhoto} 
                      onUploadComplete={u => setFormData(p => ({ ...p, primaryPhoto: u }))} 
                      onClear={() => setFormData(p => ({ ...p, primaryPhoto: '' }))}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-prism-400">Memory Gallery</label>
                      <span className="text-[10px] font-bold text-prism-300">{formData.additionalPhotos.length} / 9 photos</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {formData.additionalPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-prism-100 shadow-sm bg-white">
                          <img src={photo || undefined} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => setFormData(p => ({ ...p, additionalPhotos: p.additionalPhotos.filter((_, i) => i !== idx) }))}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {formData.additionalPhotos.length < 9 && (
                        <FilePicker 
                          compact 
                          resetAfterUpload
                          path="events" 
                          onUploadComplete={u => setFormData(p => ({ ...p, additionalPhotos: [...p.additionalPhotos, u] }))} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-prism-700 block mb-4">Tags & Identifiers</label>
                  <div className="flex gap-2 mb-6">
                    <Input 
                      placeholder="Add a tag..." 
                      value={currentTag} 
                      onChange={e => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button variant="secondary" onClick={addTag} size="icon">
                      <Plus size={20} />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-prism-50 rounded-2xl border border-dashed border-prism-200">
                    {formData.tags.length === 0 && (
                      <p className="text-sm text-prism-300 m-auto">No tags added yet</p>
                    )}
                    {formData.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-prism-100 text-prism-700 rounded-full text-xs font-bold shadow-sm"
                      >
                        #{tag}
                        <button 
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-accent-blue/5 rounded-2xl">
                  <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-2">Quick Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => !formData.tags.includes(cat.toLowerCase()) && setFormData(p => ({ ...p, tags: [...p.tags, cat.toLowerCase()] }))}
                        className="px-3 py-1 rounded-lg bg-white border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue hover:text-white transition-all shadow-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-prism-700 block mb-4">Journey Collaborators</label>
                  <UserSearch 
                    onSelect={u => setFormData(p => ({ ...p, participants: [...p.participants, u] }))} 
                    selectedUids={[user!.uid, ...formData.participants.map(p => p.uid)]} 
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-prism-400 uppercase tracking-widest">Added People</h4>
                  <div className="space-y-2">
                    {formData.participants.length === 0 && (
                      <p className="text-sm text-prism-300 italic py-4 text-center">Seeking companions for this journey...</p>
                    )}
                    {formData.participants.map(p => (
                      <div key={p.uid} className="flex items-center justify-between p-3 bg-white border border-prism-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          {p.photoURL ? (
                            <img src={p.photoURL || undefined} alt={p.displayName || ''} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-prism-100 flex items-center justify-center text-xs font-bold">
                              {p.email[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-bold text-prism-700">{p.displayName || p.email}</span>
                        </div>
                        <button 
                          onClick={() => removeParticipant(p.uid)}
                          className="p-1.5 text-prism-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-8 flex justify-between items-center bg-white">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  step === i ? "w-8 bg-accent-blue" : "w-1.5 bg-prism-100",
                  step > i && "bg-accent-blue/40"
                )} 
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="prism" disabled={loading}>
                {loading ? <Loader2 className="animate-spin text-white" size={20} /> : (
                  <>{editEvent ? "Save Changes" : "Create Milestone"}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
    </Dialog>
  );
}
