import React, { useState } from 'react';
import { LifeEvent } from '../types';
import { Calendar, Tag as TagIcon, Users, Edit2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { CreateEventDialog } from './CreateEventDialog';
import { cn } from '../lib/utils';

interface EventCardProps {
  event: LifeEvent;
  onClick?: (event: LifeEvent) => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const { isEditor, user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  
  const isOwner = user?.uid === event.ownerId;
  const canEdit = isEditor || isOwner;

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        onClick={() => onClick?.(event)}
        className={cn(
          "group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-prism-100 h-full flex flex-col relative",
          compact ? "min-h-0" : "min-h-[400px]"
        )}
      >
        {canEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="absolute top-3 right-3 z-30 p-2 bg-white/90 backdrop-blur-sm rounded-full text-prism-400 hover:text-accent-blue shadow-sm transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Milestone"
          >
            <Edit2 size={16} />
          </button>
        )}

        {!compact && (
          <div className={cn("relative overflow-hidden shrink-0", "h-48")}>
            <img 
              src={event.primaryPhoto || "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1200"} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              {event.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-prism-900 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={cn("flex-1 flex flex-col", compact ? "p-4" : "p-5")}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-prism-400 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span className="text-xs font-medium">{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span className="text-xs font-medium line-clamp-1">{event.location.address.split(',')[0]}</span>
              </div>
            )}
            {event.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <TagIcon size={14} className="text-accent-purple" />
                <span className="text-xs font-bold text-accent-purple">#{event.tags[0]}</span>
              </div>
            )}
          </div>
          
          <h3 className="font-display font-bold text-prism-900 group-hover:text-accent-blue transition-colors text-lg mb-2 line-clamp-1">
            {event.title}
          </h3>
          
          <p className="text-prism-500 leading-relaxed mb-4 flex-1 text-sm line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-prism-50">
            <div className="flex items-center gap-1.5 text-prism-400">
              <Users size={14} />
              <span className="text-xs font-medium">{event.participants.length} Participants</span>
            </div>
            {!compact && (
              <button className="text-xs font-bold text-accent-blue hover:underline">
                View Journey
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showEdit && (
          <CreateEventDialog 
            editEvent={event}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
}
