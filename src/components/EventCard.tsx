import React, { useState } from 'react';
import { LifeEvent } from '../types';
import { Calendar, Tag as TagIcon, Users, Edit2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { CreateEventDialog } from './CreateEventDialog';

interface EventCardProps {
  event: LifeEvent;
  onClick?: (event: LifeEvent) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
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
        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-prism-100 h-full flex flex-col relative"
      >
        {canEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full text-prism-400 hover:text-accent-blue shadow-sm transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Milestone"
          >
            <Edit2 size={16} />
          </button>
        )}
        <div className="relative h-48 overflow-hidden">
        <img 
          src={event.primaryPhoto} 
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
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-prism-400 mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span className="text-xs font-medium">{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span className="text-xs font-medium line-clamp-1">{event.location.address.split(',')[0]}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-prism-900 mb-2 group-hover:text-accent-blue transition-colors line-clamp-1 font-display">
          {event.title}
        </h3>
        
        <p className="text-sm text-prism-500 line-clamp-2 leading-relaxed mb-4 flex-1">
          {event.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-prism-50">
          <div className="flex items-center gap-1.5 text-prism-400">
            <Users size={14} />
            <span className="text-xs font-medium">{event.participants.length} Participants</span>
          </div>
          <button className="text-xs font-bold text-accent-blue hover:underline">
            View Journey
          </button>
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
