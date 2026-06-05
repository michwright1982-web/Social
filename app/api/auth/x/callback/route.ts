import { NextRequest } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS, getAppCredentials } from '@/lib/oauth-token';
import { oauthPopupResponse } from '@/lib/oauth-popup';

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
    return oauthPopupResponse({ error: 'x_denied' });
  }

  // ── CSRF check & Recovery ──────────────────────────────────────────────────
  const storedStateRaw = req.cookies.get('oauth_state_x')?.value;
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
    return oauthPopupResponse({ error: 'x_state_mismatch' });
  }

  if (!code) {
    return oauthPopupResponse({ error: 'x_missing_params' });
  }

  // ── Retrieve PKCE verifier ────────────────────────────────────────────────
  const codeVerifierEncrypted = req.cookies.get('oauth_pkce_x')?.value;
  let codeVerifier = '';
  if (codeVerifierEncrypted) {
    try {
      codeVerifier = await decryptToken(codeVerifierEncrypted);
    } catch {
      return oauthPopupResponse({ error: 'x_pkce_decrypt' });
    }
  } else {
    return oauthPopupResponse({ error: 'x_missing_params' });
  }

  // ── Exchange code → access token ──────────────────────────────────────────
  const { clientId, clientSecret } = await getAppCredentials(req, 'x', companyId);
  if (!clientId || !clientSecret) {
    console.error('[x/callback] Missing client ID or secret in config');
    return oauthPopupResponse({ error: 'x_token_failed' });
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
    return oauthPopupResponse({ error: 'x_token_failed' });
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

  const response = oauthPopupResponse({ connected: 'x' });
  response.cookies.set(`oauth_x_${companyId}`, encrypted, COOKIE_OPTIONS);
  response.cookies.delete('oauth_state_x');
  response.cookies.delete('oauth_pkce_x');
  return response;
}
