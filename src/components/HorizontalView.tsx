import React, { useRef } from 'react';
import { LifeEvent } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { EventCard } from './EventCard';

interface HorizontalViewProps {
  events: LifeEvent[];
  onEventClick: (event: LifeEvent) => void;
}

export function HorizontalView({ events, onEventClick }: HorizontalViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/container min-h-[600px] flex items-center">
      {/* Scroll Controls */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-prism-100 text-prism-900 opacity-0 group-hover/container:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-prism-100 text-prism-900 opacity-0 group-hover/container:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} />
      </button>

      {/* Horizontal Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-0 pb-12 pt-4 px-[20vw] snap-x snap-mandatory relative"
      >
        {/* The Timeline Axis Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-prism-100 to-transparent -translate-y-1/2 pointer-events-none" />

        {sortedEvents.map((event, index) => {
          const isAbove = index % 2 === 0;
          
          return (
            <div
              key={event.id}
              className="flex-none w-[300px] md:w-[400px] relative px-4 flex flex-col justify-center snap-center"
            >
              {/* Dot on the Line */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-4 h-4 rounded-full prism-gradient shadow-lg shadow-accent-purple/30 ring-4 ring-white" />
                
                {/* Connector Stem */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-px bg-gradient-to-transparent from-prism-200 
                    ${isAbove ? 'bottom-full h-24 mb-2' : 'top-full h-24 mt-2'}`} 
                />
              </div>

              {/* The Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: isAbove ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`w-full relative z-10 ${isAbove ? 'mb-[240px]' : 'mt-[240px]'}`}
              >
                <div className="max-w-[320px] mx-auto">
                  <EventCard event={event} onClick={onEventClick} compact={true} />
                </div>
              </motion.div>

              {/* Year Label in the empty space? Or just keep it clean */}
              <div className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-prism-300
                ${isAbove ? 'top-[calc(50%+24px)]' : 'bottom-[calc(50%+24px)]'}`}>
                {new Date(event.date).getFullYear()}
              </div>
            </div>
          );
        })}
      </div>

      {sortedEvents.length === 0 && (
        <div className="w-full text-center py-20">
          <p className="text-prism-400 text-lg">Your horizon is open for new memories.</p>
        </div>
      )}
    </div>
  );
}
