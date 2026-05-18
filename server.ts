
import express from 'express';
import session from 'express-session';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

// Declare session types
declare module 'express-session' {
  interface SessionData {
    googleTokens?: any;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the proxy (Cloud Run) to ensure secure cookies work correctly
  app.set('trust proxy', 1);

  const getGoogleClient = (req?: express.Request) => {
    const host = req?.get('host');
    const protocol = req?.protocol === 'http' && host?.includes('.run.app') ? 'https' : (req?.protocol || 'https');
    const redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL}/auth/google/callback` 
      : (host ? `${protocol}://${host}/auth/google/callback` : undefined);

    return new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  const getAppUrl = (req: express.Request) => {
    if (process.env.APP_URL) return process.env.APP_URL;
    const host = req.get('host');
    const protocol = req.protocol === 'http' && host?.includes('.run.app') ? 'https' : req.protocol;
    return `${protocol}://${host}`;
  };

  app.use(express.json());

  // OAuth Cookie Configuration for Iframe Context
  app.use(session({
    name: 'lifeprism.sid', // Custom name to avoid conflicts
    secret: 'prism-lifetime-secret',
    resave: true, // Force save to help with iframe consistency
    saveUninitialized: false, // Don't create sessions for bots/anonymous until needed
    cookie: {
      secure: true,      // Required for SameSite=None
      sameSite: 'none',  // Required for cross-origin iframe
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Logging middleware for debugging session issues
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      console.log(`[Server] ${req.method} ${req.path} - SessionID: ${req.sessionID} - HasTokens: ${!!req.session.googleTokens}`);
    }
    next();
  });

  // --- Google Photos OAuth Routes ---

  app.get('/api/auth/google/url', (req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: 'Google OAuth credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your secrets.' 
      });
    }

    const client = getGoogleClient(req);
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/photoslibrary.readonly',
        'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      include_granted_scopes: true
    });
    res.json({ url: authorizeUrl });
  });

  app.get('/api/auth/google/login', (req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    const client = getGoogleClient(req);
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/photoslibrary.readonly',
        'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      include_granted_scopes: true
    });
    res.redirect(authorizeUrl);
  });

  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      const client = getGoogleClient(req);
      const { tokens } = await client.getToken(code as string);
      
      // Merge tokens if we already have some (to keep refresh_token)
      req.session.googleTokens = tokens.refresh_token 
        ? tokens 
        : { ...req.session.googleTokens, ...tokens };

      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.send(`
          <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
              <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h2 style="color: #0f172a; margin-bottom: 0.5rem;">Connected Successfully</h2>
                <p style="color: #64748b;">Closing window and returning to LifePrism...</p>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                    setTimeout(() => window.close(), 1000);
                  } else {
                    window.location.href = '/';
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      });
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // --- Picker API Endpoints ---

  app.get('/api/photos/picker/start', async (req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    if (!req.session.googleTokens) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fff; color: #0f172a; text-align: center; padding: 2rem;">
            <h2 style="margin-bottom: 0.5rem;">Connection Needed</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">Please sign in to Google to access your photos.</p>
            <button onclick="window.close()" style="padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Close & Retry</button>
          </body>
        </html>
      `);
    }

    try {
      const client = getGoogleClient(req);
      client.setCredentials(req.session.googleTokens);

      const appUrl = getAppUrl(req);
      const callbackUri = `${appUrl}/auth/google/picker-callback`;

      const response = await client.request({
        url: 'https://photospicker.googleapis.com/v1/pickerSessions',
        method: 'POST',
        data: {
          callbackUri,
          maxImages: 50
        }
      });

      const pickerUri = (response.data as any).pickerUri;
      
      req.session.save(() => {
        res.redirect(pickerUri);
      });
    } catch (error: any) {
      console.error('Picker Start Error:', error.response?.data || error.message);
      res.status(500).send('Failed to start Google Photos Picker. Please try again.');
    }
  });

  app.get('/api/photos/picker/session', async (req, res) => {
    if (!req.session.googleTokens) {
      console.log('Session tokens missing in /api/photos/picker/session');
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const client = getGoogleClient(req);
      client.setCredentials(req.session.googleTokens);

      const appUrl = getAppUrl(req);
      const callbackUri = `${appUrl}/auth/google/picker-callback`;
      
      console.log(`[Picker] Creating session with callback: ${callbackUri}`);

      const response = await client.request({
        url: 'https://photospicker.googleapis.com/v1/pickerSessions',
        method: 'POST',
        data: {
          callbackUri,
          maxImages: 50
        }
      });

      console.log(`[Picker] Session created: ${(response.data as any).id}`);
      
      // Save session again just in case (e.g. if tokens were refreshed)
      req.session.save(() => {
        res.json(response.data);
      });
    } catch (error: any) {
      console.error('Create Picker Session Error Details:', JSON.stringify(error.response?.data || error.message, null, 2));
      if (error.response?.status === 401) {
        req.session.googleTokens = undefined;
        req.session.save(() => {
          res.status(401).json({ error: 'Google session expired' });
        });
        return;
      }
      res.status(500).json({ error: 'Failed to create picker session' });
    }
  });

  app.get('/auth/google/picker-callback', (req, res) => {
    const { sessionId } = req.query;
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #0f172a; margin-bottom: 0.5rem;">Selection Complete</h2>
            <p style="color: #64748b;">Syncing your chosen memories...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'PICKER_SUCCESS', 
                  sessionId: '${sessionId}' 
                }, '*');
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/api/photos/picker/items', async (req, res) => {
    const { sessionId } = req.query;
    if (!req.session.googleTokens) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const client = getGoogleClient(req);
      client.setCredentials(req.session.googleTokens);

      const response = await client.request({
        url: `https://photospicker.googleapis.com/v1/pickerSessions/${sessionId}/mediaItems`,
        method: 'GET'
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Fetch Picker Items Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch picked items' });
    }
  });

  app.get('/api/albums', async (req, res) => {
    if (!req.session.googleTokens) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const client = getGoogleClient(req);
      client.setCredentials(req.session.googleTokens);
      
      const response = await client.request({
        url: 'https://photoslibrary.googleapis.com/v1/albums',
        params: { pageSize: 50 }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Fetch Albums Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch albums' });
    }
  });

  app.get('/api/photos', async (req, res) => {
    if (!req.session.googleTokens) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { albumId, pageToken } = req.query;
    const client = getGoogleClient(req);

    try {
      client.setCredentials(req.session.googleTokens);
      
      console.log('Fetching Google Photos for user. AlbumId:', albumId || 'none', 'PageToken:', pageToken || 'none');
      
      let response;
      if (albumId) {
        response = await client.request({
          url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
          method: 'POST',
          data: {
            albumId: albumId,
            pageSize: 100,
            pageToken: pageToken
          }
        });
      } else {
        // Prefer GET /v1/mediaItems for general library browsing
        // It's more reliable for all photos than search with no criteria
        response = await client.request({
          url: 'https://photoslibrary.googleapis.com/v1/mediaItems',
          method: 'GET',
          params: { 
            pageSize: 100,
            pageToken: pageToken
          }
        });
      }

      res.json(response.data);
      console.log(`Successfully fetched from Google Photos. Items found: ${response.data.mediaItems?.length || 0}`);
    } catch (error: any) {
      console.error('Fetch Photos Error:', error.response?.data || error.message);
      
      // Fallback: If list failed, try search as last resort
      if (!albumId && error.response?.status !== 401) {
        try {
          console.log('GET list failed, trying POST search fallback...');
          const fallbackResponse = await client.request({
            url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
            method: 'POST',
            data: { pageSize: 100 }
          });
          return res.json(fallbackResponse.data);
        } catch (searchError) {
          console.error('Search fallback also failed');
        }
      }

      if (error.response?.status === 403) {
        console.error('Permission Denied Details:', JSON.stringify(error.response?.data, null, 2));
      }
      if (error.response?.status === 401) {
        req.session.googleTokens = undefined;
        return res.status(401).json({ error: 'Google session expired' });
      }
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  });

  app.get('/api/auth/google/status', (req, res) => {
    res.json({ connected: !!req.session.googleTokens });
  });

  app.get('/api/search/images', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });
    
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) {
      // Fallback for demo/dev if key isn't set yet
      return res.json({ 
        results: [
          { 
            id: 'mock1', 
            urls: { regular: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80' },
            user: { name: 'Sample' }
          }
        ]
      });
    }

    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        headers: { Authorization: `Client-ID ${key}` },
        params: { query: q, per_page: 20 }
      });
      res.json(response.data);
    } catch (error) {
      console.error('Unsplash Error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/photos/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).send('URL is required');
    if (!req.session.googleTokens) return res.status(401).send('Not authenticated');

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      const contentType = response.headers['content-type'] as string || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.send(response.data);
    } catch (error) {
      console.error('Photo Proxy Error:', error);
      res.status(500).send('Failed to fetch photo');
    }
  });

  // --- Vite / Production Setup ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
