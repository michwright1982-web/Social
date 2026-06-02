import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

const BRAND_CONTEXT_COOKIE = 'ai_brand_context';

/**
 * GET /api/brand
 * Returns the saved Brand Context from the encrypted cookie.
 */
export async function GET(req: NextRequest) {
  const rawCookie = req.cookies.get(BRAND_CONTEXT_COOKIE)?.value;
  if (!rawCookie) {
    return NextResponse.json({ context: '' });
  }

  try {
    const decrypted = await decryptToken(rawCookie);
    return NextResponse.json({ context: decrypted });
  } catch (error) {
    console.error('Failed to parse brand context from cookie:', error);
    return NextResponse.json({ context: '' });
  }
}

/**
 * POST /api/brand
 * Encrypts and saves the Brand Context to cookie.
 */
export async function POST(req: NextRequest) {
  let context = '';
  try {
    const body = await req.json();
    context = body.context || '';
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const encrypted = await encryptToken(context);

    const response = NextResponse.json({ success: true });
    response.cookies.set(BRAND_CONTEXT_COOKIE, encrypted, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Failed to save brand context:', error);
    return NextResponse.json({ error: 'Failed to encrypt or save brand context' }, { status: 500 });
  }
}
