import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

const OAUTH_CREDS_COOKIE_PREFIX = 'oauth_app_creds_';

export type OAuthAppCredentials = {
  [platform: string]: {
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
    
    // We only return the pageId preferences
    const publicCreds: Record<string, { pageId?: string }> = {};
    for (const [platform, config] of Object.entries(creds)) {
      publicCreds[platform] = {
        pageId: config.pageId,
      };
    }
    
    return NextResponse.json(publicCreds);
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

  let newCreds: Record<string, { pageId?: string }> = {};
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
    } catch {
       // Ignore corrupt cookie
    }
  }

  const mergedCreds: OAuthAppCredentials = { ...existingCreds };
  
  for (const [platform, config] of Object.entries(newCreds)) {
    // If the client explicitly sends an empty pageId, we can delete the config
    if (!config.pageId) {
      delete mergedCreds[platform];
      continue;
    }
    
    mergedCreds[platform] = {
      pageId: config.pageId.trim(),
    };
  }

  const payload = JSON.stringify(mergedCreds);
  const encrypted = await encryptToken(payload);

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, encrypted, COOKIE_OPTIONS);
  return response;
}
