# Prism: Your Collective Lifetime 💎

**Prism** is a high-fidelity collective milestone and legacy tracker. It transforms individual memories into a curated, searchable, and collaborative **Lifeline**, allowing friends and family to contribute their own perspectives to shared achievements.

Designed with a technical, clean, and high-contrast aesthetic, Prism pairs modern UI patterns with robust data integration to ensure your memories are preserved and celebrated.

---

## ✨ Features

- 📸 **Native Google Photos Integration**: Seamlessly import memories using the latest Google Photos Picker API (v1) with a secure server-side proxy.
- 🗺️ **Spatial & Temporal Perspectives**: View your life through a standard Timeline, Compact List, or high-density Bento Grid.
- 🤝 **Collective Contribution**: Invite friends and family to contribute photos and stories to your milestones in real-time.
- 🤖 **AI-Assisted Storytelling**: (Beta) AI integration to help summarize and curate descriptions for your life milestones.
- ⚡ **Performance First**: Client-side optimization combined with an Express backend for ultra-fast, secure image proxying.
- 🛡️ **Hardened Privacy**: Built-in authentication and zero-trust Firestore rules to keep your legacy data private and secure.

---

## 🏗️ Architecture

Prism is built as a robust full-stack application with a clear separation of concerns:

### Frontend (SPA)
- **React 18 + Vite**: High-performance single-page application entry point.
- **Tailwind CSS 4.0**: Utility-first styling for a sleek, responsive "Prism" aesthetic.
- **Motion (Framer)**: Fluid transitions and purposeful micro-animations to guide user attention.

### Backend (Server-side)
- **Express + tsx**: A TypeScript-powered Node.js server that handles:
  - **OAuth 2.0**: Secure authentication flow with Google.
  - **Google Photos Picker API**: A dedicated session-based picker for selective, privacy-preserving photo access.
  - **Secure Image Proxy**: An authenticated proxy server that fetches Google user content while keeping API keys and tokens hidden from the client.

### Data & Storage
- **Firebase Auth**: Unified user management.
- **Cloud Firestore**: Real-time Document DB for milestone metadata and collaborative state.
- **Firebase Storage**: Persistent storage for user-uploaded media.

---

## 🚀 Quick Start

### Online
View the live app in AI Studio: [Prism Preview](https://ai.studio/build)

### Local Development
1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Configure Environment**:
   - Create a `.env` file.
   - Set `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
3. **Run**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Tech Stack

- **Framework**: React 18 / Express
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animation**: Motion (Framer)
- **Backend**: Firebase + Node.js (Express)
- **APIs**: Google Photos Picker API v1, Cloud Firestore

---

## ⚖️ License
MIT © 2024 LifePrism Team
