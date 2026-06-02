import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAppCredentials } from '@/lib/oauth-token';

/**
 * GET /api/auth/facebook/connect
 * Redirects the user to Facebook's OAuth consent screen.
 * Uses a random `state` param stored in a short-lived cookie for CSRF protection.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { clientId } = await getAppCredentials(req, 'facebook');

  if (!clientId) {
    return NextResponse.redirect(new URL('/vault?error=missing_credentials', req.url));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    state,
    scope: [
      'pages_show_list',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(','),
    response_type: 'code',
  });

  const response = NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`,
  );

  // Store state in a short-lived HttpOnly cookie for CSRF validation
  response.cookies.set('oauth_state_fb', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  });

  return response;
}
