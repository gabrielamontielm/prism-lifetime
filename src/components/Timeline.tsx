/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LifeEvent } from '../types';
import { EventCard } from './EventCard';
import { motion, AnimatePresence } from 'motion/react';

interface TimelineProps {
  events: LifeEvent[];
  onEventClick?: (event: LifeEvent) => void;
}

export function Timeline({ events, onEventClick }: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative py-12 px-4">
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue via-accent-purple to-accent-pink opacity-20 hidden md:block" />

      <div className="max-w-7xl mx-auto space-y-12 md:space-y-24">
        <AnimatePresence>
          {sortedEvents.map((event, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={event.id} className="relative">
                <div className="absolute left-1/2 -ml-2 w-4 h-4 rounded-full prism-gradient hidden md:block z-10 shadow-lg shadow-accent-purple/30 mt-24" />
                
                <div className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  <div className="w-full md:w-1/2 px-4 md:px-12 flex justify-center">
                    <div className="w-full max-w-md">
                      <EventCard event={event} onClick={onEventClick} />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 hidden md:block" />
                </div>
              </div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {sortedEvents.length === 0 && (
        <div className="text-center py-20">
          <p className="text-prism-400 text-lg">Your timeline is ready to be painted with memories.</p>
        </div>
      )}
    </div>
  );
}
