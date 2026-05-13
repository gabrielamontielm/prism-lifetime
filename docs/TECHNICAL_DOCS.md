# Technical Documentation

This document covers the architectural decisions, state management patterns, and system design of LifePrism.

## 🏗️ Architecture Overview

LifePrism is built as a **Single Page Application (SPA)** with a serverless backend.

- **Frontend**: React 19 (using standardized functional components and hooks).
- **Styles**: Tailwind CSS 4.0 with a custom `prism` theme defined in `src/index.css`.
- **Backend-as-a-Service**: Firebase (Firestore, Authentication).
- **External Resources**: Google Maps Platform (Maps, Places).

## 📊 State Management

LifePrism avoids complex global state management libraries like Redux, preferring **React Context** and **Custom Hooks** for agility and performance.

### Custom Hooks
- `useAuth`: Manages the Firebase Auth subscriber and provides the `user` and `loading` state to the entire app via `AuthContext`.
- `useTimeline`: The core data hook. It sets up a real-time `onSnapshot` listener to Firestore, filtering events based on user participation.

## 🛡️ Security Model (Zero-Trust)

Our Firestore rules are built on a "Master Gate" pattern.

### Key Security Pillars:
1. **Identity Integrity**: Every write verifies that the `authorId` matches the authenticated `request.auth.uid`.
2. **Relational Sync**: Access to sub-resources is strictly tied to membership in the main participant list.
3. **Immutability**: Fields like `createdAt` and `authorId` cannot be modified after document creation.
4. **Validation Blueprints**: Every document write is passed through `isValidEvent()` which checks:
   - Data types (string, timestamp, etc.)
   - String size limits (prevents denial-of-wallet attacks)
   - Map key strictness (no "ghost" fields allowed)

## 🖼️ Image Handling Pipeline

To prevent slow load times and bloated database costs, LifePrism performs **Client-Side Optimization**:

1. **Capture**: User selects an image.
2. **Resize**: `src/lib/image.ts` uses the HTML5 Canvas API to resize images to a `maxWidth` of 1200px.
3. **Compress**: The canvas is converted to a `Blob` at 0.7 quality.
4. **Upload**: Only the optimized JPEG is sent to the storage provider.

## 🗺️ Multi-View Layout Engine

The view switching logic is handled in `App.tsx` via a `viewMode` state.

- **Component Isolation**: Each view (`Timeline`, `MapView`, `BentoView`, `StorySlideshow`) is a standalone component, allowing for easy maintenance and testing.
- **Geospatial Processing**: `MapView` uses `@vis.gl/react-google-maps` for high-performance marker rendering and dynamic camera management.

## 🛠️ Testing Strategy

- **Unit Tests**: Using `Vitest` for business logic (e.g., date calculations, image resizing helpers).
- **Component Tests**: Using `React Testing Library` for critical UI flows like the Milestone Creator.
- **Security Tests**: Using `@firebase/rules-unit-testing` to verify that unauthorized users cannot "scrape" or "inject" memories.
