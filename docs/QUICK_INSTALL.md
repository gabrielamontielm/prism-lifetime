# Quick Install Guide

Follow these steps to set up LifePrism for local development.

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Firebase Account**: Access to a Firebase Project

## 🛠️ Step-by-Step Setup

### 1. Repository Preparation
Clone the repository and enter the directory:
```bash
git clone <repository-url>
cd lifeprism
```

### 2. Dependency Installation
Install all required packages:
```bash
npm install
```

### 3. Firebase Configuration
LifePrism requires a Firebase project.
1. Go to the [Firebase Console](https://console.firebase.com).
2. Create a new project named "LifePrism".
3. Enable **Firestore Database** and **Authentication** (Google Provider).
4. Register a Web App and copy the `firebaseConfig` object.
5. Create a file named `firebase-applet-config.json` in the root directory (if not already present) and populate it with your credentials:
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

### 4. Google Maps Platform
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Enable **Maps JavaScript API** and **Places API**.
3. Create an API Key and restrict it to your local environment.
4. Add the key to your `.env.local`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### 5. Environment Variables
Ensure your `.env.local` contains:
```env
GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

### 6. Development Server
Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 🧪 Running Tests
To run the automated suite:
```bash
npm test
```

## 🏗️ Building for Production
```bash
npm run build
```
Static files will be generated in the `dist/` directory.
