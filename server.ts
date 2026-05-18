
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
    const { code, sessionId, error } = req.query;

    if (sessionId || error) {
      console.log(`[Picker] Callback received. SessionId: ${sessionId}, Error: ${error}`);
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h2 style="color: #0f172a; margin-bottom: 0.5rem;">${error ? 'Selection Error' : 'Selection Complete'}</h2>
              <p style="color: #64748b;">${error ? 'There was an issue selecting your photos.' : 'Syncing your chosen memories...'}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: '${error ? 'PICKER_ERROR' : 'PICKER_SUCCESS'}', 
                    sessionId: '${sessionId || ''}',
                    error: '${error || ''}'
                  }, '*');
                  setTimeout(() => window.close(), 800);
                } else {
                  window.close();
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('No code provided');
    }

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

      // Proactively refresh tokens if possible
      try {
        const { token } = await client.getAccessToken();
        if (token && token !== req.session.googleTokens.access_token) {
           req.session.googleTokens = { ...req.session.googleTokens, access_token: token };
           await new Promise<void>((resolve) => req.session.save(() => resolve()));
        }
      } catch (tokenError) {
        console.warn('Token refresh failed (non-fatal):', tokenError);
      }

      const response = await client.request({
        url: 'https://photospicker.googleapis.com/v1/sessions',
        method: 'POST',
        data: {}
      });

      const pickerUri = (response.data as any).pickerUri || (response.data as any).picker_uri;
      
      req.session.save(() => {
        res.redirect(pickerUri);
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('Picker Start Error Details:', JSON.stringify(errorData || error.message, null, 2));
      
      if (error.response?.status === 403) {
         return res.status(500).send('Failed to start Google Photos Picker: Permission denied. Make sure the Picker API is enabled in your Google Cloud Console.');
      }
      
      res.status(500).send(`Failed to start Google Photos Picker. ${error.message}`);
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
      
      // Proactively refresh tokens if possible
      try {
        const { token } = await client.getAccessToken();
        if (token && token !== req.session.googleTokens.access_token) {
           req.session.googleTokens = { ...req.session.googleTokens, access_token: token };
           await new Promise<void>((resolve) => req.session.save(() => resolve()));
        }
      } catch (tokenError) {
        console.warn('Token refresh failed in /picker/session:', tokenError);
      }

      const appUrl = getAppUrl(req);
      const callbackUri = `${appUrl}/auth/google/callback`;

      let response;
      try {
         console.log(`[Picker] Creating session with picker_config (snake_case) and callbackUri: ${callbackUri}`);
         response = await client.request({
           url: 'https://photospicker.googleapis.com/v1/sessions',
           method: 'POST',
           data: {
             picker_config: {
               v1_config: {
                 max_items: 100
               }
             },
             callbackUri
           }
         });
      } catch (err: any) {
         console.warn('[Picker] snake_case session creation failed, trying camelCase...', err.response?.data || err.message);
         try {
           response = await client.request({
             url: 'https://photospicker.googleapis.com/v1/sessions',
             method: 'POST',
             data: {
               pickerConfig: {
                 v1Config: {
                   maxItems: 100
                 }
               },
               callbackUri
             }
           });
         } catch (err2: any) {
            console.warn('[Picker] camelCase session creation failed, trying without callbackUri...', err2.response?.data || err2.message);
            try {
              response = await client.request({
                url: 'https://photospicker.googleapis.com/v1/sessions',
                method: 'POST',
                data: {
                  pickerConfig: {
                    v1Config: {
                      maxItems: 100
                    }
                  }
                }
              });
            } catch (err3) {
              console.warn('[Picker] All configured creations failed, falling back to empty body.');
              response = await client.request({
                url: 'https://photospicker.googleapis.com/v1/sessions',
                method: 'POST',
                data: {}
              });
            }
         }
      }

      console.log(`[Picker] Session created successfully. ID: ${(response.data as any).id}`);
      
      // Save session again just in case (e.g. if tokens were refreshed)
      req.session.save(() => {
        res.json(response.data);
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('Create Picker Session Error Details:', JSON.stringify(errorData || error.message, null, 2));
      
      if (error.response?.status === 401) {
        req.session.googleTokens = undefined;
        req.session.save(() => {
          res.status(401).json({ error: 'Google session expired. please reconnect.' });
        });
        return;
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({ error: 'Permission denied. Ensure the Google Photos Picker API is enabled.' });
      }

      res.status(500).json({ 
        error: 'Failed to create picker session', 
        details: errorData || error.message 
      });
    }
  });

  app.get('/api/photos/picker/items', async (req, res) => {
    const { sessionId } = req.query;
    if (!req.session.googleTokens) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const client = getGoogleClient(req);
      client.setCredentials(req.session.googleTokens);

      console.log(`[Picker] Fetching results for session: ${sessionId}`);

      const response = await client.request({
        url: `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
        method: 'GET'
      });

      const data = response.data as any;
      console.log(`[Picker] GET /v1/sessions/${sessionId} - Status: ${response.status}`);
      
      const isSet = data.mediaItemsSet === true || data.media_items_set === true;
      let items = data.mediaItems || data.media_items || data.pickedMediaItems || data.picked_media_items || [];

      // If media items are marked as set but the array is empty, fetch from the sub-resource
      if (isSet && items.length === 0) {
        console.log(`[Picker] mediaItemsSet is true but array is empty. Fetching from /v1/mediaItems?sessionId=${sessionId}`);
        try {
          const itemsResponse = await client.request({
            url: `https://photospicker.googleapis.com/v1/mediaItems`,
            method: 'GET',
            params: { sessionId }
          });
          const itemsData = itemsResponse.data as any;
          items = itemsData.mediaItems || itemsData.media_items || itemsData.pickedMediaItems || itemsData.picked_media_items || [];
          
          if (items.length > 0) {
            console.log(`[Picker] /v1/mediaItems returned ${items.length} items. First item keys: ${Object.keys(items[0]).join(', ')}`);
          } else {
            console.log(`[Picker] /v1/mediaItems was empty, trying sub-resource /v1/sessions/${sessionId}/mediaItems`);
            const subRes = await client.request({
              url: `https://photospicker.googleapis.com/v1/sessions/${sessionId}/mediaItems`,
              method: 'GET'
            });
            const subData = subRes.data as any;
            items = subData.mediaItems || subData.media_items || [];
            console.log(`[Picker] Sub-resource returned ${items.length} items`);
          }
          
          data.mediaItems = items; // Inject into response for frontend
        } catch (itemsError: any) {
          console.warn('[Picker] Failed to fetch mediaItems:', itemsError.response?.data || itemsError.message);
        }
      }
      
      console.log(`[Picker] Final session response - items: ${items.length}, isSet: ${isSet}`);
      res.json(data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('Fetch Picker Items Error:', JSON.stringify(errorData || error.message, null, 2));
      res.status(500).json({ error: 'Failed to fetch picked items', details: errorData });
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
        console.error('Permission Denied (403). Required scopes might be missing or user did not grant library access.');
        console.error('Permission Denied Details:', JSON.stringify(error.response?.data, null, 2));
        return res.status(403).json({ 
          error: 'Permission Denied. Please ensure you checked the "See your Google Photos library" box during sign-in.' 
        });
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
    if (!url || typeof url !== 'string') {
      console.warn('[Proxy] URL missing or invalid type');
      return res.status(400).send('URL is required');
    }

    // Security check: Only allow images from Google or Unsplash
    let isAllowed = false;
    let isGoogleApiUrl = false;
    let isGoogleUserContent = false;
    
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      const isGoogleDomain = 
        hostname === 'googleapis.com' ||
        hostname.endsWith('.googleapis.com') ||
        hostname === 'googleusercontent.com' ||
        hostname.endsWith('.googleusercontent.com');

      isAllowed = 
        hostname === 'images.unsplash.com' || isGoogleDomain;

      isGoogleApiUrl = isGoogleDomain;
        
    } catch (e) {
      console.warn('[Proxy] Invalid URL string:', url);
      return res.status(400).send('Invalid URL');
    }

    if (!isAllowed) {
      console.warn('[Proxy] Forbidden domain:', url);
      return res.status(403).send('Proxying this domain is not allowed');
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      // Both photospicker.googleapis.com and googleusercontent.com (baseUrl) 
      // often require the token in the new Picker API v1
      if (isGoogleApiUrl) {
        if (!req.session.googleTokens) {
          console.warn('[Proxy] Missing tokens for Google API URL');
          return res.status(401).send('Not authenticated with Google');
        }

        const client = getGoogleClient(req);
        client.setCredentials(req.session.googleTokens);

        try {
          const accessTokenResponse = await client.getAccessToken();
          const accessToken = accessTokenResponse.token;
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
        } catch (tokenError) {
           console.error('[Proxy] Failed to refresh/get access token:', tokenError);
           return res.status(401).send('Failed to authenticate with Google');
        }
      }

      console.log(`[Proxy] Fetching: ${url.substring(0, 80)}...`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers,
        timeout: 10000 // 10s timeout
      });

      const contentType = response.headers['content-type'] as string || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(response.data);
    } catch (error: any) {
      console.error('[Proxy] Error fetching photo:', error.response?.status || error.message, url.substring(0, 60));
      if (error.response?.status) {
        return res.status(error.response.status).send(`Failed to fetch photo: Upsream returned ${error.response.status}`);
      }
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