import React from 'react';
import { LifeEvent } from '../types';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface BentoViewProps {
  events: LifeEvent[];
  onEventClick: (event: LifeEvent) => void;
}

export function BentoView({ events, onEventClick }: BentoViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[200px]">
      {events.map((event, index) => {
        // Create a distinct pattern for the bento grid
        const isWide = index % 5 === 1;
        const isTall = index % 5 === 3;
        const isBig = index % 5 === 0;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEventClick(event)}
            className={cn(
              "group relative overflow-hidden rounded-3xl cursor-pointer border border-prism-100 shadow-sm hover:shadow-xl transition-all duration-500 bg-white",
              isWide && "md:col-span-2",
              isTall && "md:row-span-2",
              isBig && "md:col-span-2 md:row-span-2"
            )}
          >
            {/* Background Image */}
            {event.primaryPhoto ? (
              <img 
                src={event.primaryPhoto} 
                alt={event.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-prism-50 to-prism-100" />
            )}

            {/* Overlay Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300",
              !event.primaryPhoto && "bg-gradient-to-t from-prism-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100"
            )} />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {event.tags.slice(0, 1).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className={cn(
                  "font-display font-bold leading-tight group-hover:translate-x-1 transition-transform",
                  isBig ? "text-2xl" : "text-lg"
                )}>
                  {event.title}
                </h3>

                <div className="flex items-center gap-4 text-white/70 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(event.date).getFullYear()}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span className="truncate max-w-[100px]">{event.location.address.split(',')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plain content for events without photos when not hovered */}
            {!event.primaryPhoto && (
              <div className="absolute inset-0 flex flex-col p-6 group-hover:hidden">
                 <div className="flex items-center gap-2 text-prism-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                  <Calendar size={12} className="text-accent-blue" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-display font-bold text-prism-900 mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-prism-500 line-clamp-3">
                  {event.description}
                </p>
                <div className="mt-auto flex items-center gap-1.5 text-[10px] font-bold text-accent-blue">
                  <Users size={12} />
                  <span>{event.participants.length} Collaborators</span>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
