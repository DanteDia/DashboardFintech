#!/usr/bin/env node

/**
 * Google OAuth2 Refresh Token Generator
 *
 * Usage:
 *   1. Set your credentials in .env.local (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
 *   2. Add http://localhost:3000/callback as authorized redirect URI in Google Cloud Console
 *   3. Run: node scripts/get-refresh-token.js
 *   4. Browser opens → sign in with your Google account
 *   5. Copy the refresh_token into .env.local
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to read from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
let CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key?.trim() === 'GOOGLE_CLIENT_ID' && !CLIENT_ID) CLIENT_ID = value;
    if (key?.trim() === 'GOOGLE_CLIENT_SECRET' && !CLIENT_SECRET) CLIENT_SECRET = value;
  });
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing credentials!');
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.\n');
  console.error('Example .env.local:');
  console.error('  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
  console.error('  GOOGLE_CLIENT_SECRET=your-client-secret\n');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error}</h1><p>Please try again.</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>No authorization code received</h1>');
      return;
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Token Error</h1><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
        server.close();
        process.exit(1);
      }

      console.log('\n✅ Success! Here are your tokens:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n👆 Add this line to your .env.local file\n');

      if (tokens.access_token) {
        console.log(`Access Token (temporary, expires in ${tokens.expires_in}s):`);
        console.log(`${tokens.access_token.substring(0, 30)}...\n`);
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px;">
            <h1 style="color: #22c55e;">✅ Token obtained successfully!</h1>
            <p>Check your terminal for the refresh token.</p>
            <p>Add it to your <code>.env.local</code> file as:</p>
            <pre style="background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto;">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
            <p style="color: #64748b;">You can close this tab now.</p>
          </body>
        </html>
      `);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error exchanging code</h1><pre>${err.message}</pre>`);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(302, { Location: authUrl });
    res.end();
  }
});

server.listen(3000, () => {
  console.log('\n🔐 Google OAuth2 Refresh Token Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nOpening browser for Google sign-in...\n');

  // Open browser
  const platform = process.platform;
  const openCmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  try {
    execSync(`${openCmd} "${authUrl}"`);
  } catch {
    console.log('Could not open browser automatically. Open this URL manually:');
    console.log(authUrl);
  }

  console.log('Waiting for callback on http://localhost:3000/callback ...\n');
});
