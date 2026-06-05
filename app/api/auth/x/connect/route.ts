import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, getAppCredentials } from '@/lib/oauth-token';

/**
 * GET /api/auth/x/connect
 * Redirects the user to X (Twitter) OAuth 2.0 consent screen using PKCE.
 * X requires PKCE (Proof Key for Code Exchange) for public/confidential clients.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const { clientId } = await getAppCredentials(req, 'x', companyId);

  if (!clientId) {
    return NextResponse.redirect(new URL('/vault?error=missing_credentials', req.url));
  }

  const redirectUri = `${appUrl}/api/auth/x/callback`;

  // Generate PKCE code verifier & challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             clientId,
    redirect_uri:          redirectUri,
    scope:                 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
  );

  // Store PKCE verifier and state + companyId in short-lived cookies
  const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 600, path: '/' };
  const cookiePayload = JSON.stringify({ state, companyId });
  response.cookies.set('oauth_state_x', cookiePayload, cookieOpts);
  response.cookies.set('oauth_pkce_x', await encryptToken(codeVerifier), cookieOpts);

  return response;
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
