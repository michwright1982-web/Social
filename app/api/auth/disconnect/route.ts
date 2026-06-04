import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_COOKIES: Record<string, string> = {
  facebook: 'oauth_fb',
  x:        'oauth_x',
  linkedin: 'oauth_li',
};

/**
 * POST /api/auth/disconnect
 * Body: { platform: 'facebook' | 'x' | 'linkedin' }
 *
 * Deletes the OAuth cookie for the given platform, effectively disconnecting it.
 */
export async function POST(req: NextRequest) {
  let body: { platform?: string; companyId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { platform, companyId = 'default' } = body;

  if (!platform || !PLATFORM_COOKIES[platform]) {
    return NextResponse.json(
      { error: `Unknown platform "${platform}". Must be one of: ${Object.keys(PLATFORM_COOKIES).join(', ')}` },
      { status: 400 },
    );
  }

  const cookieName = `${PLATFORM_COOKIES[platform]}_${companyId}`;

  const response = NextResponse.json({ success: true, platform });
  response.cookies.set(cookieName, '', {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    0,     // Expire immediately
    path:      '/',
  });

  return response;
}
