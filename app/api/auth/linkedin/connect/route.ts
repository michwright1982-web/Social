import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAppCredentials } from '@/lib/oauth-token';

/**
 * GET /api/auth/linkedin/connect
 * Redirects the user to LinkedIn's OAuth 2.0 consent screen.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { clientId } = await getAppCredentials(req, 'linkedin');

  if (!clientId) {
    return NextResponse.redirect(new URL('/vault?error=missing_credentials', req.url));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    state,
    scope:         'openid profile w_member_social',
  });

  const response = NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
  );

  response.cookies.set('oauth_state_li', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return response;
}
