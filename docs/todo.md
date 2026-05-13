# LifePrism Implementation Roadmap

This document outlines the tasks completed and the remaining steps for the LifePrism platform.

## Phase 1: Foundation & Infrastructure (Completed)

### 101: Project Scaffolding
- Dependent on: None
- [x] Initial Vite + React + TypeScript setup
- [x] Tailwind CSS configuration with custom Prism theme
- [x] Lucide React icon integration

### 102: Firebase Core Integration
- Dependent on: 101
- [x] Firestore database initialization
- [x] Firebase Authentication (Google Login)
- [x] Development of base `useTimeline` and `useAuth` hooks

### 103: Security Hardening (Phase 6 Rules)
- Dependent on: 102
- [x] Implementation of "Eight Pillars" of hardened Firestore rules
- [x] Validation of `isValidId` and relational sync gates
- [x] Error handling bridge for "Insufficient Permissions"

## Phase 2: Core Milestone Engine (Completed)

### 201: Event Creation Wizard
- Dependent on: 102
- [x] Multi-step dialog (Basic Info -> Details -> Collaboration)
- [x] Google Places API integration for location tagging
- [x] Tag management system

### 202: Image Optimization Bridge
- Dependent on: 201
- [x] Client-side canvas resizing logic in `src/lib/image.ts`
- [x] File picker with drag-and-drop and instant optimization
- [x] Multi-photo gallery support

### 203: Primary Timeline Views
- Dependent on: 201
- [x] Standard vertical timeline with card layouts
- [x] Compact "List" view for high data density
- [x] Global search and tag filtering logic

## Phase 3: Immersive Experience (Completed)

### 301: Geospatial View (Map)
- Dependent on: 201
- [x] Integration of `@vis.gl/react-google-maps`
- [x] Advanced Markers with custom Pins and InfoWindows
- [x] Fly-to logic for selected milestones

### 302: Story Slideshow Engine
- Dependent on: 201
- [x] Full-screen auto-advancing slideshow view
- [x] Progress bar indicator and pause-on-click functionality
- [x] Immersive layout with blur-background effects

### 303: Bento Grid Layout
- Dependent on: 203
- [x] Irregular CSS Grid implementation for mixed content density
- [x] Dynamic sizing logic (Wide vs. Tall vs. Big) based on index
- [x] Hover states for revealing metadata

## Phase 4: Collaboration & Real-time Connectivity

### 401: Real-time User Search Component
- Dependent on: 102
- [ ] Create a `UserSearch` component in the milestone creator
- [ ] Implement debounced Firestore queries to find users by email/name
- [ ] Add "Collaborator" chips to the UI with removal functionality

### 402: Milestone Permission Bridge
- Dependent on: 401, 103
- [ ] Update `useTimeline` hook to support adding collaborators to a document
- [ ] Verify Firestore Security Rules allow collaborators to view/edit (already in rules, needs tests)
- [ ] Create a `CollaboratorsList` component for the Event Detail modal

### 403: Activity Notification Trigger
- Dependent on: 402
- [ ] Implement a function to create a notification document when a collaborator is added
- [ ] Add a `useNotifications` hook to listen to the user-specific notifications collection
- [ ] Create a global `NotificationCenter` toast system to alert users in real-time

## Phase 5: Export & Final Polish

### 501: Print-Optimized Layout
- Dependent on: 203
- [ ] Create a dedicated CSS media query `@media print` for the standard timeline
- [ ] Develop a "Print Preview" mode that hides navigation and UI chrome
- [ ] Add a "Print Lifeline" button to the sidebar

### 502: PDF Generation Service
- Dependent on: 501
- [ ] Integrate a library to trigger browser print-to-pdf functionality
- [ ] Implement pagination logic to ensure milestone cards don't split across pages
- [ ] Add custom branding (header/footer) to the PDF output

### 503: Final Design Refinement
- Dependent on: All Views
- [ ] Implement `ResizeObserver` on Bento and Map views for fluid container scaling
- [ ] Add framer-motion stagger effects to the Bento Grid entrance
- [ ] Complete Accessibility (ARIA) audit for all interactive view-mode toggles
