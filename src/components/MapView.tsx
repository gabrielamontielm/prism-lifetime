import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { LifeEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Tag as TagIcon, ArrowRight } from 'lucide-react';

interface MapViewProps {
  events: LifeEvent[];
  onEventClick: (event: LifeEvent) => void;
}

interface MarkerWithInfoWindowProps {
  event: LifeEvent;
  onClick: () => void;
  key?: string;
}

function MarkerWithInfoWindow({ event, onClick }: MarkerWithInfoWindowProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  if (!event.location) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: event.location.lat, lng: event.location.lng }}
        onClick={() => setOpen(true)}
      >
        <Pin 
          background={"#4285F4"} 
          glyphColor={"#fff"} 
          borderColor={"#1a73e8"} 
        />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 max-w-[240px]">
            {event.primaryPhoto && (
              <img 
                src={event.primaryPhoto || undefined} 
                alt={event.title} 
                className="w-full h-32 object-cover rounded-xl mb-3"
                referrerPolicy="no-referrer"
              />
            )}
            <h4 className="font-display font-bold text-prism-900 mb-1">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-prism-400 mb-3">
              <Calendar size={12} />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <button 
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-prism-900 text-white rounded-lg text-xs font-bold hover:bg-prism-800 transition-colors"
            >
              View Milestone <ArrowRight size={14} />
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function MapView({ events, onEventClick }: MapViewProps) {
  const eventsWithLocation = events.filter(e => e.location);

  // Default to a central point or the first event
  const defaultCenter = eventsWithLocation.length > 0 
    ? { lat: eventsWithLocation[0].location!.lat, lng: eventsWithLocation[0].location!.lng }
    : { lat: 37.42, lng: -122.08 };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-[600px] rounded-3xl overflow-hidden border border-prism-100 shadow-xl bg-white"
    >
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={3}
        mapId="LIFE_PRISM_MAP"
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={false}
        gestureHandling={'greedy'}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        {eventsWithLocation.map(event => (
          <MarkerWithInfoWindow 
            key={event.id} 
            event={event} 
            onClick={() => onEventClick(event)} 
          />
        ))}
      </Map>
    </motion.div>
  );
}
