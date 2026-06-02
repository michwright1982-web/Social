import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

/**
 * GET /api/auth/linkedin/callback
 * LinkedIn redirects here with ?code=... after the user approves.
 * We exchange the code for an access token and store it encrypted.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { searchParams } = new URL(req.url);

  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // ── User denied access ────────────────────────────────────────────────────
  if (error) {
    return NextResponse.redirect(`${appUrl}/vault?error=linkedin_denied`);
  }

  // ── CSRF check ────────────────────────────────────────────────────────────
  const storedState = req.cookies.get('oauth_state_li')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/vault?error=linkedin_state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/vault?error=linkedin_no_code`);
  }

  // ── Exchange code → access token ──────────────────────────────────────────
  const clientId     = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri  = `${appUrl}/api/auth/linkedin/callback`;

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!tokenRes.ok) {
    console.error('[LinkedIn OAuth] Token exchange failed:', await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/vault?error=linkedin_token_failed`);
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // ── Fetch connected profile name ──────────────────────────────────────────
  let handle = 'LinkedIn Account';
  try {
    const meRes  = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const meData = (await meRes.json()) as { name?: string; email?: string };
    handle = meData.name ?? meData.email ?? handle;
  } catch { /* non-fatal */ }

  // ── Store encrypted token + handle ────────────────────────────────────────
  const payload  = JSON.stringify({ access_token, handle, connected_at: Date.now() });
  const encrypted = await encryptToken(payload);

  const response = NextResponse.redirect(`${appUrl}/vault?connected=linkedin`);
  response.cookies.set('oauth_li', encrypted, COOKIE_OPTIONS);
  response.cookies.delete('oauth_state_li');
  return response;
}
