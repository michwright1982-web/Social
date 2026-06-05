import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

export const dynamic = 'force-dynamic';

interface TokenPayload {
  access_token:  string;
  handle:        string;
  connected_at:  number;
}

const PLATFORM_COOKIES: Record<string, string> = {
  facebook: 'oauth_fb',
  x:        'oauth_x',
  linkedin: 'oauth_li',
};

/**
 * GET /api/auth/status
 * Returns the connection status of each platform based on cookie presence.
 * Called by the Vault page on mount to show real connection state.
 *
 * Response shape:
 * {
 *   facebook:  { connected: true,  handle: 'Page Name',   connected_at: 1234567890 },
 *   x:         { connected: false },
 *   linkedin:  { connected: false },
 * }
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const result: Record<string, { connected: boolean; handle?: string; connected_at?: number }> = {};

  for (const [platform, baseCookieName] of Object.entries(PLATFORM_COOKIES)) {
    const cookieName = `${baseCookieName}_${companyId}`;
    const rawCookie = req.cookies.get(cookieName)?.value;

    if (!rawCookie) {
      result[platform] = { connected: false };
      continue;
    }

    try {
      const decrypted = await decryptToken(rawCookie);
      const payload   = JSON.parse(decrypted) as TokenPayload;
      result[platform] = {
        connected:    true,
        handle:       payload.handle,
        connected_at: payload.connected_at,
      };
    } catch {
      result[platform] = { connected: false };
    }
  }


  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
