import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Calendar, MapPin, MessageSquare, ExternalLink } from 'lucide-react';
import { LifeEvent } from '../types';
import { cn } from '../lib/utils';

interface StorySlideshowProps {
  events: LifeEvent[];
  onClose: () => void;
  onEventClick: (event: LifeEvent) => void;
}

const STORY_DURATION = 8000; // 8 seconds per story

export function StorySlideshow({ events, onClose, onEventClick }: StorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const event = events[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, events.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // Update progress every 50ms
    const step = (interval / STORY_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 sm:p-8">
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={event.primaryPhoto || "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1200"} 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
          alt=""
        />
      </div>

      <div className="relative w-full max-w-lg aspect-[9/16] bg-prism-900 rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-6 left-6 right-6 z-10 flex gap-1.5 leading-none">
          {events.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-white transition-all duration-75",
                  idx < currentIndex ? "w-full" : idx === currentIndex ? "transition-none" : "w-0"
                )}
                style={{ width: idx === currentIndex ? `${progress}%` : undefined }}
              />
            </div>
          ))}
        </div>

        {/* Top Actions */}
        <div className="absolute top-10 left-6 right-6 z-10 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {event.tags[0] || 'Milestone'}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="absolute inset-0" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img 
                src={event.primaryPhoto || "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1200"} 
                alt={event.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* Text Content */}
              <div className="absolute bottom-16 left-8 right-8 text-white">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar size={12} />
                    <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <h2 className="text-4xl font-bold font-display leading-[1.1]">{event.title}</h2>
                  
                  <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                    {event.description}
                  </p>

                  <div className="pt-4 flex items-center gap-3">
                    <button 
                      onClick={() => onEventClick(event)}
                      className="flex items-center gap-2 bg-white text-prism-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-white/90 transition-colors"
                    >
                      Realize Story <ExternalLink size={14} />
                    </button>
                    {event.location && (
                      <div className="flex items-center gap-1.5 px-3 py-3 bg-white/10 rounded-2xl text-[10px] font-bold">
                        <MapPin size={14} />
                        <span className="truncate max-w-[100px]">{event.location.address.split(',')[0]}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute inset-0 flex">
          <div 
            className="w-1/3 h-full cursor-w-resize" 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
          />
          <div 
            className="flex-1 h-full cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); handleNext(); }} 
          />
        </div>

        {/* Desktop Browser Controls */}
        <div className="hidden sm:block">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute -left-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white hover:text-prism-900 text-white rounded-full transition-all disabled:opacity-0"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute -right-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white hover:text-prism-900 text-white rounded-full transition-all"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]">
          Story {currentIndex + 1} of {events.length}
        </p>
      </div>
    </div>
  );
}
