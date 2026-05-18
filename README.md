# LifePrism

## Overview
**LifePrism** is a high-fidelity personal milestone and legacy tracker. It transforms the standard photo gallery into a curated, searchable, and collaborative **Lifeline**.

Designed with a "Prism" aesthetic—technical, clean, and high-contrast—pairing modern UI patterns with robust geospatial and temporal data. It acts as a collaborative timeline for chronicling life achievements and milestones with shared perspectives.

**Key capabilities include:**
- **Multi-View Engine**: Explore milestones via Standard Timeline, Compact List, Map View, Immersive Stories, or a Bento Grid.
- **Geospatial Intelligence**: Precise location tagging via Google Maps and Places APIs.
- **Collaboration**: Invite friends and family to share and contribute to milestones.
- **Performance**: High-speed image optimization and rendering.
- **Security**: Robust, hardened access control.

### App Previews

![Dashboard View](docs/assets/dashboard.png)

*Dashboard Timeline*

![Compact View](docs/assets/compact_view.png)

*Compact View*

![Bento Grid](docs/assets/bento_view.png)

*Bento Grid Visualization*

---

## System Requirements & Prerequisites

Before setting up LifePrism, ensure you have the following installed and configured:

### Environment Requirements
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or equivalent package manager)

### Third-Party Services
1. **Firebase Account**:
   - A Firebase project with **Firestore Database** and **Authentication (Google Provider)** enabled.
   - You must have your `firebaseConfig` object ready.
2. **Google Maps Platform**:
   - A Google Cloud Console project with the **Maps JavaScript API** and **Places API** enabled.
   - A restricted API key for Google Maps.
3. **Google Gemini API**:
   - A Gemini API key for any AI-integrated features.

---

## Getting Started Locally

1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   cd lifeprism
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
   ```

3. **Configure Firebase**:
   Create a file named `firebase-applet-config.json` in the root directory with your Firebase project credentials:
   ```json
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "storageBucket": "...",
     "messagingSenderId": "...",
     "appId": "...",
     "firestoreDatabaseId": "(default)"
   }
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## How to Deploy

You can deploy LifePrism using various methods depending on your preferred hosting provider.

### 1. Standard Production Build
To generate static production files:
```bash
npm run build
```
This command compiles the React application and outputs the optimized static assets into the `dist/` directory. You can serve this directory using any static file server (e.g., Nginx, Apache, or a Node.js Express server). The project also includes a `server.ts` file that can serve the built production files via Express if you run `npm run start` after building.

### 2. Deploying to Firebase Hosting
Since LifePrism heavily utilizes Firebase, Firebase Hosting is a natural fit.
1. Install the Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Login and initialize your project:
   ```bash
   firebase login
   firebase init hosting
   ```
   *When asked for the public directory, specify `dist`. Configure it as a single-page app (SPA) by rewriting all URLs to `/index.html`.*
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### 3. Deploying to Vercel
Vercel provides seamless deployment for Vite/React applications.
1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command from the project root:
   ```bash
   vercel
   ```
   *Alternatively, connect your GitHub/GitLab repository directly in the Vercel Dashboard for automatic deployments.*
3. **Environment Variables**: Make sure to add `GEMINI_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY` in the Vercel project settings dashboard before triggering a production build.
