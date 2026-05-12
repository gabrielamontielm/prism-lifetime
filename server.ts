
import express from 'express';
import session from 'express-session';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OAuth Cookie Configuration for Iframe Context
  app.use(session({
    secret: 'prism-lifetime-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,      // Required for SameSite=None
      sameSite: 'none',  // Required for cross-origin iframe
      httpOnly: true,
    }
  }));

  // --- Google Photos OAuth Routes ---

  app.get('/api/auth/google/status', (req, res) => {
    res.json({ authenticated: !!(req.session as any).googleTokens });
  });

  app.get('/api/auth/google/config', (req, res) => {
    const baseUrl = process.env.APP_URL?.replace(/\/$/, '');
    res.json({
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: baseUrl ? `${baseUrl}/auth/google/callback` : null,
      appUrl: process.env.APP_URL
    });
  });

  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.APP_URL?.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/auth/google/callback`;

    if (!clientId) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
    }
    
    if (!process.env.APP_URL) {
      return res.status(500).json({ error: 'APP_URL not configured in environment' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code } = req.query;
    
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      });

      (req.session as any).googleTokens = response.data;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google-photos' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Google Auth Callback Error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  // --- Google Photos Proxy Routes ---

  app.get('/api/photos/albums', async (req, res) => {
    const tokens = (req.session as any).googleTokens;
    if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const response = await axios.get('https://photoslibrary.googleapis.com/v1/albums', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Fetch Albums Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch albums' });
    }
  });

  app.get('/api/photos/album/:albumId', async (req, res) => {
    const tokens = (req.session as any).googleTokens;
    if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const response = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        albumId: req.params.albumId,
        pageSize: 50
      }, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Fetch Album Photos Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch photos' });
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
