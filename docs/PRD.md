# LifePrism: Product Requirements Document (PRD)

## Project Overview
**LifePrism** is a high-fidelity personal milestone and legacy tracker. It is designed to transform the standard "photo gallery" into a curated, searchable, and collaborative "Lifeline." The app emphasizes a "Prism" aesthetic—technical, clean, and high-contrast—pairing modern UI patterns with robust geospatial and temporal data.

## Core Requirements
1. **Immutable Memories**: High data integrity for date and location tagging.
2. **Collaborative History**: Ability to invite multiple users to a single milestone (collaborators).
3. **Visual Versatility**: Support for different data densities (standard vs. compact) and contexts (map vs. story).
4. **Performance**: Optimized image handling to ensure fast loading even with high-resolution memories.
5. **Security**: Hardened Firestore rules to prevent identity spoofing and unauthorized access to private milestones.

## Core Features
- **Multi-View Layout Engine**: 
    - **Standard**: A classic, visual timeline.
    - **Compact**: A high-density text-first view for quick scanning.
    - **Map View**: Integrated Google Maps visualization for location-based milestones.
    - **Story Slideshow**: An immersive, full-screen auto-advancing experience (similar to social media stories).
    - **Bento Grid**: A modern, irregular grid layout for aesthetic data visualization.
- **Advanced Event Creation**: 
    - Multi-step wizard for high-quality data entry.
    - Google Places API for verified location tagging.
    - Image optimization engine (resizing and compression) using Canvas API.
    - Primary cover photo + Gallery of up to 9 additional memories.
- **Deep Filtering & Search**: 
    - Global string search across titles, descriptions, and tags.
    - One-tap tag filtering with prism-gradient active states.
- **Collaboration Suite**: 
    - Real-time user search via Firestore.
    - Participant list management per milestone.

## Core Components
- `App.tsx`: Central state orchestration and routing between view modes.
- `Timeline.tsx`: The primary vertical layout engine.
- `MapView.tsx`: Google Maps integration using `@vis.gl/react-google-maps`.
- `StorySlideshow.tsx`: Custom animation engine for full-screen immersive storytelling.
- `BentoView.tsx`: CSS Grid based irregular layout system.
- `CreateEventDialog.tsx`: Sophisticated multi-step form with status tracking.
- `FilePicker.tsx`: Integrated upload and image optimization UI.
- `FilterBar.tsx`: Responsive navigation and search utility.

## App/User Flow
1. **Landing**: User arrives at the dashboard and sees their most recent milestones.
2. **Explore**: User switches between View Modes (e.g., "Map" to see where they traveled or "Story" to relive a month).
3. **Filter**: User applies tags (e.g., #Travel) to narrow their Lifeline.
4. **Relive**: User clicks a milestone to see the full detail view, gallery, and collaborators.
5. **Contribute**: User adds a new milestone, searches for a location, optimizes their cover photo, and invites collaborators.

## Techstack
- **Frontend**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS (Utility-first), Lucide React (Icons).
- **Animation**: Motion (formerly Framer Motion).
- **Backend/Database**: Firebase Firestore (Enterprise Edition).
- **Authentication**: Firebase Authentication (Google Login).
- **APIs**: Google Maps JavaScript API, Google Places API.
- **Utils**: `date-fns` for temporal logic, `canvas` for client-side image processing.

## Implementation Plan
- [x] Base architecture and Firebase integration.
- [x] "Standard" and "Compact" timeline views.
- [x] Hardened Security Rules (Phase 6 implementation).
- [x] Google Maps Integration.
- [x] Story Slideshow immersive engine.
- [x] Bento Grid Layout.
- [x] Performance optimization (Image resizing & compression).
- [ ] **Next Step**: Real-time activity notifications when a collaborator is added.
- [ ] **Next Step**: Export Lifeline to PDF/Physical Book layout.
