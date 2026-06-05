import { NextRequest } from 'next/server';
import { encryptToken, COOKIE_OPTIONS, getAppCredentials } from '@/lib/oauth-token';
import { oauthPopupResponse } from '@/lib/oauth-popup';

/**
 * GET /api/auth/facebook/callback
 * Facebook redirects here with ?code=... after the user approves.
 * We exchange the code for an access token and store it encrypted in a cookie.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { searchParams } = new URL(req.url);

  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // ── User denied access ────────────────────────────────────────────────────
  if (error) {
    return oauthPopupResponse({ error: 'facebook_denied' });
  }

  // ── CSRF check & Recovery ──────────────────────────────────────────────────
  const storedStateRaw = req.cookies.get('oauth_state_fb')?.value;
  let storedState = '';
  let companyId = 'default';
  
  if (storedStateRaw) {
    try {
      const parsed = JSON.parse(storedStateRaw);
      storedState = parsed.state;
      companyId = parsed.companyId || 'default';
    } catch {
      storedState = storedStateRaw;
    }
  }

  if (!state || state !== storedState) {
    return oauthPopupResponse({ error: 'facebook_state_mismatch' });
  }

  if (!code) {
    return oauthPopupResponse({ error: 'facebook_no_code' });
  }

  // ── Exchange code → access token ──────────────────────────────────────────
  const { clientId, clientSecret } = await getAppCredentials(req, 'facebook', companyId);
  if (!clientId || !clientSecret) {
    console.error('[facebook/callback] Missing client ID or secret in config');
    return oauthPopupResponse({ error: 'facebook_token_failed' });
  }
  const redirectUri  = `${appUrl}/api/auth/facebook/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        code,
      }).toString(),
  );

  if (!tokenRes.ok) {
    console.error('[Facebook OAuth] Token exchange failed:', await tokenRes.text());
    return oauthPopupResponse({ error: 'facebook_token_failed' });
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // ── Fetch connected page/user name ────────────────────────────────────────
  let handle = 'Facebook Account';
  try {
    const meRes  = await fetch(`https://graph.facebook.com/me?fields=name&access_token=${access_token}`);
    const meData = (await meRes.json()) as { name?: string };
    handle = meData.name ?? handle;
  } catch { /* non-fatal */ }

  // ── Store encrypted token + handle ────────────────────────────────────────
  const payload  = JSON.stringify({ access_token, handle, connected_at: Date.now() });
  const encrypted = await encryptToken(payload);

  const response = oauthPopupResponse({ connected: 'facebook' });
  response.cookies.set(`oauth_fb_${companyId}`, encrypted, COOKIE_OPTIONS);
  response.cookies.delete('oauth_state_fb');
  return response;
}
