import React, { useState, useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Timeline } from './components/Timeline';
import { EventDetail } from './components/EventDetail';
import { CreateEventDialog } from './components/CreateEventDialog';
import { EditorDashboard } from './components/EditorDashboard';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { StorySlideshow } from './components/StorySlideshow';
import { BentoView } from './components/BentoView';
import { useTimeline } from './hooks/useTimeline';
import { useAuth } from './hooks/useAuth';
import { LifeEvent } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== '';

function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Parse share token from URL
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const shareToken = params.get('share');
  
  const { events, sharedOwner, loading, error } = useTimeline(shareToken);
  const { user, isEditor } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'map' | 'story' | 'bento'>('standard');

  useEffect(() => {
    if (!loading && events.length > 0) {
      const eventId = params.get('eventId');
      if (eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) setSelectedEvent(event);
      }
    }
  }, [loading, events, params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-prism-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-accent-blue mx-auto mb-4" size={48} />
          <p className="text-prism-500 font-medium font-display translate-y-2">Assembling your prism...</p>
        </div>
      </div>
    );
  }

  const allTags: string[] = Array.from(new Set<string>(events.flatMap((e: LifeEvent) => e.tags))).sort();

  const filteredEvents = events.filter(e => {
    if (!isEditor && e.status === 'archived' && !shareToken) return false;
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.description.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || e.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (!user && !shareToken) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onNewEntry={() => {}} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-prism-900 mb-8 font-display">
              Prism of <span className="text-prism">Your Life</span>
            </h1>
            <p className="text-xl text-prism-500 mb-12 leading-relaxed">
              A private, secure space to curate your milestones and memories. 
              Sign in to unlock your personal timeline and collaborate with your close ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="px-8 py-4 bg-prism-900 text-white rounded-2xl font-bold shadow-xl shadow-prism-900/20">
                Secure & Collaborative
              </div>
              <div className="px-8 py-4 bg-white border border-prism-100 text-prism-600 rounded-2xl font-bold">
                Identity Protected
              </div>
            </div>
          </motion.div>
        </main>
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-blue/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-pink/10 blur-[120px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onNewEntry={() => setIsCreating(true)} />
      
      <main className="max-w-7xl mx-auto py-12 px-6">
        <header className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-prism-900 mb-6 font-display"
          >
            {shareToken ? (
              <>
                {sharedOwner ? `${sharedOwner.displayName}'s ` : 'Someone\'s '} <span className="text-prism">Shared Life</span>
              </>
            ) : (
              <>
                The Gallery of <span className="text-prism">Your Life</span>
              </>
            )}
          </motion.h2>
          <p className="text-lg text-prism-500 max-w-2xl mx-auto leading-relaxed">
            {shareToken 
              ? `You are viewing ${sharedOwner?.displayName || 'someone'}'s prism of memories. Explore the achievements and milestones curated here.`
              : "Every achievement is a prism, reflecting the light of your journey. Browse your milestones and the perspectives of those who shared them."}
          </p>
        </header>

        {isEditor && !shareToken && <EditorDashboard />}

        <div className="mt-20">
          <FilterBar 
            search={search}
            setSearch={setSearch}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            allTags={allTags}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {error ? (
            <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
              <p className="text-red-500 font-medium">Failed to synchronize your timeline.</p>
              <p className="text-sm text-red-400 mt-2">Please check your permissions or try again later.</p>
            </div>
          ) : viewMode === 'map' ? (
            <MapView 
              events={filteredEvents} 
              onEventClick={(event) => setSelectedEvent(event)} 
            />
          ) : viewMode === 'story' ? (
            <StorySlideshow 
              events={filteredEvents} 
              onClose={() => setViewMode('standard')}
              onEventClick={(event) => setSelectedEvent(event)} 
            />
          ) : viewMode === 'bento' ? (
            <BentoView 
              events={filteredEvents} 
              onEventClick={(event) => setSelectedEvent(event)} 
            />
          ) : (
            <Timeline 
              events={filteredEvents} 
              onEventClick={(event) => setSelectedEvent(event)} 
              compact={viewMode === 'compact'}
            />
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedEvent && (
          <EventDetail 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
          />
        )}
        
        {isCreating && (
          <CreateEventDialog 
            onClose={() => setIsCreating(false)} 
            onSuccess={() => {}} 
          />
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-blue/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-pink/10 blur-[120px]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {hasValidMapsKey ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
          <Dashboard />
        </APIProvider>
      ) : (
        <Dashboard />
      )}
    </AuthProvider>
  );
}
