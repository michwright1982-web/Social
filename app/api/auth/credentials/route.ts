import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

const OAUTH_CREDS_COOKIE_PREFIX = 'oauth_app_creds_';

export type OAuthAppCredentials = {
  [platform: string]: {
    clientId: string;
    clientSecret: string;
    pageId?: string;
  };
};

/**
 * GET /api/auth/credentials
 * Returns saved OAuth App credentials from the encrypted cookie.
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const cookieName = `${OAUTH_CREDS_COOKIE_PREFIX}${companyId}`;
  const rawCookie = req.cookies.get(cookieName)?.value;
  if (!rawCookie) {
    return NextResponse.json({});
  }

  try {
    const decrypted = await decryptToken(rawCookie);
    const creds = JSON.parse(decrypted) as OAuthAppCredentials;
    
    // For GET requests, we shouldn't send back full secrets to the client.
    // Instead we mask them so the UI knows they are set, but they aren't exposed.
    const maskedCreds: Record<string, { clientId: string; isSecretSet: boolean; pageId?: string }> = {};
    for (const [platform, config] of Object.entries(creds)) {
      maskedCreds[platform] = {
        clientId: config.clientId,
        isSecretSet: !!config.clientSecret,
        pageId: config.pageId,
      };
    }
    
    return NextResponse.json(maskedCreds);
  } catch (error) {
    console.error('Failed to parse OAuth creds from cookie:', error);
    return NextResponse.json({});
  }
}

/**
 * POST /api/auth/credentials
 * Saves the OAuth App credentials. If the incoming secret is empty but the clientID is sent,
 * we keep the old secret (since the UI might mask it).
 */
export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const cookieName = `${OAUTH_CREDS_COOKIE_PREFIX}${companyId}`;

  let newCreds: Record<string, { clientId: string; clientSecret?: string; pageId?: string }> = {};
  try {
    newCreds = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Read existing credentials first
  let existingCreds: OAuthAppCredentials = {};
  const rawCookie = req.cookies.get(cookieName)?.value;
  if (rawCookie) {
    try {
      const decrypted = await decryptToken(rawCookie);
      existingCreds = JSON.parse(decrypted) as OAuthAppCredentials;
    } catch (e) {
       // Ignore corrupt cookie
    }
  }

  // Merge them (preserve old secrets if the UI sends an empty secret for an existing app)
  const mergedCreds: OAuthAppCredentials = { ...existingCreds };
  
  for (const [platform, config] of Object.entries(newCreds)) {
    // If the client explicitly sends an empty clientId, we can assume they are deleting the config
    if (!config.clientId) {
      delete mergedCreds[platform];
      continue;
    }
    
    const oldSecret = existingCreds[platform]?.clientSecret;
    mergedCreds[platform] = {
      clientId: config.clientId.trim(),
      // Use new secret if provided, otherwise keep old secret
      clientSecret: (config.clientSecret || oldSecret || '').trim(),
      pageId: config.pageId?.trim() || existingCreds[platform]?.pageId || '',
    };
  }

  const payload = JSON.stringify(mergedCreds);
  const encrypted = await encryptToken(payload);

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, encrypted, COOKIE_OPTIONS);
  return response;
}
