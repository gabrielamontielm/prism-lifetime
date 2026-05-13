# LifePrism 💎

**LifePrism** is a high-fidelity personal milestone and legacy tracker. It transforms the standard photo gallery into a curated, searchable, and collaborative **Lifeline**.

Designed with a "Prism" aesthetic—technical, clean, and high-contrast—pairing modern UI patterns with robust geospatial and temporal data.

---

## ✨ Features

- 🗺️ **Multi-View Engine**: Standard Timeline, Compact List, Google Maps view, Immersive Stories, and Bento Grid.
- 📍 **Geospatial Intelligence**: Integrated Google Places API for precision milestone tagging.
- 🤝 **Live Collaboration**: Invite friends and family to contribute to your milestones in real-time.
- ⚡ **Performance Optimized**: Client-side image resizing and optimization for ultra-fast loading.
- 🛡️ **Zero-Trust Security**: Hardened Firestore rules protecting your legacy data.

---

## 🚀 Quick Start

### Online
View the live app in AI Studio: [LifePrism Preview](https://ai.studio/apps/9ce632e7-e094-4767-961c-44b6863e2bd3)

### Local Development
1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Configure Environment**:
   - Create a `.env.local` file.
   - Set `GEMINI_API_KEY` and other required VITE_ variables from your [Google Cloud Console](https://console.cloud.google.com/).
3. **Run**:
   ```bash
   npm run dev
   ```

---

## 📖 Documentation

- [**Quick Install Guide**](./docs/QUICK_INSTALL.md) - Deep dive into local setup.
- [**User Guide**](./docs/USER_GUIDE.md) - How to build your Lifeline.
- [**Technical Documentation**](./docs/TECHNICAL_DOCS.md) - Architecture, Hooks, and Security.
- [**Product Requirements (PRD)**](./docs/PRD.md) - Core vision and scope.

---

## 🛠️ Tech Stack

- **Framework**: React 18 / Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animation**: Motion (Framer)
- **Backend**: Firebase Firestore / Auth
- **Testing**: Vitest / React Testing Library

---

## ⚖️ License
MIT © 2024 LifePrism Team
