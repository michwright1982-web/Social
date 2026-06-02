import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS, getAppCredentials } from '@/lib/oauth-token';

/**
 * GET /api/auth/x/callback
 * X (Twitter) redirects here with ?code=... after user approves.
 * We use PKCE: retrieve the verifier from cookie, exchange for token.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { searchParams } = new URL(req.url);

  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // ── User denied access ────────────────────────────────────────────────────
  if (error) {
    return NextResponse.redirect(`${appUrl}/vault?error=x_denied`);
  }

  // ── CSRF check ────────────────────────────────────────────────────────────
  const storedState = req.cookies.get('oauth_state_x')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/vault?error=x_state_mismatch`);
  }

  // ── Retrieve PKCE verifier ────────────────────────────────────────────────
  const encryptedVerifier = req.cookies.get('oauth_pkce_x')?.value;
  if (!encryptedVerifier || !code) {
    return NextResponse.redirect(`${appUrl}/vault?error=x_missing_params`);
  }

  let codeVerifier: string;
  try {
    codeVerifier = await decryptToken(encryptedVerifier);
  } catch {
    return NextResponse.redirect(`${appUrl}/vault?error=x_pkce_decrypt`);
  }

  // ── Exchange code → access token ──────────────────────────────────────────
  const { clientId, clientSecret } = await getAppCredentials(req, 'x');
  if (!clientId || !clientSecret) {
    console.error('[x/callback] Missing client ID or secret in config');
    return NextResponse.redirect(new URL('/vault?error=x_token_failed', req.url));
  }
  const redirectUri  = `${appUrl}/api/auth/x/callback`;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    console.error('[X OAuth] Token exchange failed:', await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/vault?error=x_token_failed`);
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // ── Fetch connected username ──────────────────────────────────────────────
  let handle = 'X Account';
  try {
    const meRes  = await fetch('https://api.twitter.com/2/users/me?user.fields=username', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const meData = (await meRes.json()) as { data?: { username?: string } };
    handle = meData.data?.username ? `@${meData.data.username}` : handle;
  } catch { /* non-fatal */ }

  // ── Store encrypted token + handle ────────────────────────────────────────
  const payload  = JSON.stringify({ access_token, handle, connected_at: Date.now() });
  const encrypted = await encryptToken(payload);

  const response = NextResponse.redirect(`${appUrl}/vault?connected=x`);
  response.cookies.set('oauth_x', encrypted, COOKIE_OPTIONS);
  response.cookies.delete('oauth_state_x');
  response.cookies.delete('oauth_pkce_x');
  return response;
}
